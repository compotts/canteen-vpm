"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { InterfaceSwitcher } from "@/components/interface-switcher";
import { useAuth } from "@/components/auth-provider";
import { useAdminSession } from "@/components/admin-session-provider";
import { useFavorites } from "@/components/favorites-provider";
import { favoriteKey } from "@/lib/favorites";
import { ApiError, apiFetch } from "@/lib/api/client";
import { submitOrder } from "@/lib/valgykla/client";
import {
  loadOrderHistory,
  saveOrderToHistory,
  removeOrderByMenuDate,
} from "@/lib/api/history";
import type { Menu } from "@/lib/valgykla/types";
import { loadUserProfile } from "@/lib/api/profile";
import type { UserProfile } from "@/types/api";
import type { OrderRecord } from "@/types/api";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CookingPot,
  Egg,
  Heart,
  History,
  Home,
  Info,
  Leaf,
  Milk,
  MessageSquare,
  Minus,
  Nut,
  Plus,
  Search,
  Settings2,
  ShoppingBasket,
  Soup,
  Sprout,
  Utensils,
  Wheat,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationSettings } from "@/components/notification-settings";
import {
  canteenTime,
  addMenuDays,
  isMenuDateOpen,
  menuWeek,
  suggestedMenuDate,
} from "@/lib/menu-dates";
import { loadMenuArchive } from "@/lib/api/menu-archive";
import { loadDishTranslations } from "@/lib/valgykla/translations";
import { normalizeDishName } from "@/lib/text";
import type { ArchivedMenu } from "@/lib/menu-archive";
import type { DishTranslationMap } from "@/lib/valgykla/types";
import { SECTION_TITLE_KEYS } from "@/lib/constants";
import { DesignThemeSwitcher } from "./design-theme-switcher";
import { DesignDialog } from "./design-dialog";
import { DesignNews } from "./design-news";
import { DesignFeedbackForm } from "./design-feedback-form";
import { DesignContent } from "./design-content";
import {
  DESIGN_ALLERGENS,
  DESIGN_CATEGORIES,
  type DesignAllergen,
  type DesignCategory,
  type DesignDish,
} from "./design-data";

const ALLERGEN_ICONS = { gluten: Wheat, milk: Milk, eggs: Egg, nuts: Nut };
const CATEGORY_ICONS = {
  all: Utensils,
  main: CookingPot,
  sides: Sprout,
  salads: Leaf,
  soups: Soup,
};
const NAV_ICONS = {
  home: Home,
  menu: Utensils,
  orders: ShoppingBasket,
  history: History,
};
type Screen = keyof typeof NAV_ICONS;
type Cart = Record<string, number>;
type Modal = "allergens" | "about" | "eco" | "settings" | "feedback" | null;

export function CanteenApp() {
  const t = useTranslations("design");
  const locale = useLocale();
  const homeText = useTranslations("home");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [historyRetry, setHistoryRetry] = useState(0);
  const adminTaps = useRef({ count: 0, last: 0 });
  const router = useRouter();
  const pathname = usePathname();
  const paths = {
    home: "/",
    menu: "/daily-menu",
    orders: "/order",
    history: "/history",
  };
  const screen: Screen =
    pathname === "/order"
      ? "orders"
      : pathname === "/history"
        ? "history"
        : pathname === "/daily-menu"
          ? "menu"
          : "home";
  const { logout } = useAuth();
  const { isAdmin } = useAdminSession();
  const favoritesState = useFavorites();
  const [submitting, setSubmitting] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const submittingRef = useRef(false);
  const [historyError, setHistoryError] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [date, setDate] = useState(() => suggestedMenuDate(new Date()));
  const [archive, setArchive] = useState<{
    menus: ArchivedMenu[];
    error: boolean;
    loading: boolean;
  }>({ menus: [], error: false, loading: true });
  const [archiveRetry, setArchiveRetry] = useState(0);
  const [availableArchive, setAvailableArchive] = useState<Menu | null>(null);
  const [archiveMode, setArchiveMode] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [dishTranslations, setDishTranslations] = useState<DishTranslationMap>(
    {},
  );
  const [featuredPaused, setFeaturedPaused] = useState(false);
  const [category, setCategory] = useState<DesignCategory>("all");
  const [search, setSearch] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [carts, setCarts] = useState<Record<string, Cart>>({});
  const [savedOrders, setSavedOrders] = useState<OrderRecord[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [detail, setDetail] = useState<DesignDish | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const feedbackPending = useRef(false);
  const onFeedbackPending = useCallback((pending: boolean) => {
    feedbackPending.current = pending;
  }, []);
  const closeModal = useCallback(() => {
    if (feedbackPending.current) return;
    setModal(null);
    setDetail(null);
  }, []);
  const today = canteenTime(clock).date;
  const availableDate = availableArchive?.date ?? suggestedMenuDate(clock);
  const tomorrow = addMenuDays(today, 1);
  const lastVisibleDate = availableDate > tomorrow ? availableDate : tomorrow;
  const week = menuWeek(availableDate, weekOffset);
  const days = week.filter((day) => day <= lastVisibleDate);
  while (days.length && days.length < 5) days.unshift(addMenuDays(days[0], -1));
  const canGoForward =
    menuWeek(availableDate, weekOffset + 1)[0] <= lastVisibleDate;
  const canGoBack = weekOffset > -52;
  const dateCanBeOrdered = isMenuDateOpen(date, availableDate, clock);
  const selectedArchive = archive.menus.find((entry) => entry.date === date);
  const getDishName = (dish: DesignDish) => dish.name ?? dish.sourceName;
  const getDishWeight = (dish: DesignDish, quantity = 1) =>
    dish.grams !== null
      ? `${Math.round(dish.grams * quantity)} ${t("grams")}`
      : quantity === 1
        ? dish.weightLabel || t("weightUnknown")
        : `${quantity} ${t("portions")}`;
  const archiveDishes = (menu?: ArchivedMenu | Menu | null): DesignDish[] =>
    (menu?.sections ?? []).flatMap((section) =>
      section.items.map((item) => {
        const entry = dishTranslations[normalizeDishName(item.name)];
        const name =
          (locale === "ru" ? entry?.ru : locale === "en" ? entry?.en : null) ||
          item.name;
        const key = SECTION_TITLE_KEYS[section.title.trim().toLowerCase()];
        const group =
          key === "catalog.category.sriubos"
            ? "soups"
            : key === "catalog.category.salotos"
              ? "salads"
              : "main";
        const simpleWeight = (item.weight ?? "").match(
          /^(\d+(?:[.,]\d+)?)\s*(?:g|г)?$/i,
        );
        return {
          id: `menu-${menu?.date}-${item.id}`,
          name,
          sourceId: item.id,
          sourceName: item.name,
          category: group,
          photo: entry?.photo ?? "",
          grams: simpleWeight
            ? Number(simpleWeight[1].replace(",", "."))
            : null,
          weightLabel: item.weight,
          cents: Math.round(item.price * 100),
          allergens: null,
        };
      }),
    );
  const currentSource =
    availableArchive?.date === availableDate ? availableArchive : null;
  const currentDishes = archiveDishes(currentSource);
  const menuOpen =
    dateCanBeOrdered && archiveMode === "ready" && currentDishes.length > 0;
  const orderable = menuOpen && !submitting && !uncertain;
  const menuDishes =
    date === availableArchive?.date
      ? currentDishes
      : archiveDishes(selectedArchive);
  const featuredDishes = currentDishes;
  const activeFeaturedIndex = featuredDishes.length
    ? featuredIndex % featuredDishes.length
    : 0;

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const archiveFrom = days[0] ?? week[0];
  const archiveTo = days[days.length - 1] ?? archiveFrom;
  useEffect(() => {
    const controller = new AbortController();
    loadMenuArchive(archiveFrom, archiveTo, controller.signal)
      .then(({ menus }) => {
        if (!controller.signal.aborted)
          setArchive({ menus, error: false, loading: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setArchive({ menus: [], error: true, loading: false });
      });
    return () => controller.abort();
  }, [archiveFrom, archiveTo, archiveRetry]);

  useEffect(() => {
    loadDishTranslations().then(setDishTranslations);
  }, []);

  const menuBoundary = `${today}:${canteenTime(clock).hour >= 9}`;
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ menu: Menu | null }>("/api/current-menu", {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(({ menu }) => {
        if (controller.signal.aborted) return;
        setAvailableArchive(menu);
        setArchiveMode("ready");
        if (menu) {
          setDate(menu.date);
          setCarts((previous) => ({
            ...previous,
            [menu.date]:
              previous[menu.date] ??
              Object.fromEntries(
                menu.sections.flatMap((section) =>
                  section.items.map((item) => [
                    `menu-${menu.date}-${item.id}`,
                    Number(item.initialQuantity.replace(",", ".")) || 0,
                  ]),
                ),
              ),
          }));
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setArchiveMode("error");
        if (error instanceof ApiError && error.status === 401) logout();
      });
    return () => controller.abort();
  }, [archiveRetry, logout, menuBoundary]);

  useEffect(() => {
    let active = true;
    loadOrderHistory()
      .then((orders) => {
        if (active) {
          setSavedOrders(orders);
          setHistoryError(false);
        }
      })
      .catch(() => {
        if (active) setHistoryError(true);
      });
    return () => {
      active = false;
    };
  }, [historyRetry]);

  useEffect(() => {
    const controller = new AbortController();
    loadUserProfile(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setProfile(value);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (featuredPaused || modal || detail || !featuredDishes.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const timer = setInterval(() => {
      if (!document.hidden) setFeaturedIndex((previous) => previous + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, [featuredPaused, modal, detail, featuredDishes.length]);

  const changeWeek = (delta: number) => {
    const offset = weekOffset + delta;
    const next = menuWeek(availableDate, offset).filter(
      (day) => day <= lastVisibleDate,
    );
    if (!next.length) return;
    setWeekOffset(offset);
    setDate(
      next.includes(date)
        ? date
        : (next.filter((day) => day <= today).at(-1) ?? next[0]),
    );
    setArchive({ menus: [], error: false, loading: true });
    setSearch("");
    setCategory("all");
    setNotice(null);
  };

  const openAvailableMenu = () => {
    setDate(availableDate);
    setWeekOffset(0);
    setCategory("all");
    setSearch("");
    setOnlyFavorites(false);
    navigate("menu");
  };
  const cart = carts[date] ?? {};
  const money = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  const formatDate = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(
      new Date(`${value}T12:00:00`),
    );
  const dateLabel = formatDate(date, { day: "numeric", month: "long" });
  const cartItems = menuDishes.filter((dish) => cart[dish.id] > 0);
  const total = cartItems.reduce(
    (sum, dish) => sum + Math.round(dish.cents * cart[dish.id]),
    0,
  );
  const featured = featuredDishes[activeFeaturedIndex];
  const visibleDishes = menuDishes.filter(
    (dish) =>
      (category === "all" || dish.category === category) &&
      (!onlyFavorites ||
        favoritesState.keys.has(favoriteKey(dish.sourceName))) &&
      getDishName(dish)
        .toLocaleLowerCase(locale)
        .includes(search.trim().toLocaleLowerCase(locale)),
  );

  const quantityFor = (id: string) => drafts[id] ?? "1";
  const validQuantity = (value: string) => {
    const quantity = Number(value.replace(",", "."));
    return Number.isFinite(quantity) && quantity > 0 && quantity <= 20
      ? quantity
      : null;
  };
  const changeCart = (id: string, quantity: number) => {
    if (!orderable || !isMenuDateOpen(date, availableArchive?.date ?? null))
      return;
    setCarts((previous) => {
      const next = { ...previous[date] };
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return { ...previous, [date]: next };
    });
    setNotice(null);
  };
  const addDish = (dish: DesignDish) => {
    const quantity = validQuantity(quantityFor(dish.id));
    if (
      !orderable ||
      quantity === null ||
      !isMenuDateOpen(date, availableArchive?.date ?? null)
    )
      return;
    changeCart(dish.id, quantity);
    setNotice(t("added", { name: getDishName(dish) }));
  };
  const toggleFavorite = (id: string) => {
    const dish = menuDishes.find((item) => item.id === id);
    if (dish) void favoritesState.toggle(dish.sourceName);
  };
  const navigate = (value: Screen) => {
    router.push(paths[value]);
    setFeaturedPaused(false);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const saveOrder = async () => {
    if (
      submittingRef.current ||
      !orderable ||
      !isMenuDateOpen(date, availableArchive?.date ?? null)
    )
      return;
    submittingRef.current = true;
    setSubmitting(true);
    setNotice(null);
    try {
      await submitOrder(
        date,
        Object.fromEntries(
          currentDishes.map((dish) => [
            String(dish.sourceId),
            cart[dish.id] ? String(cart[dish.id]) : "",
          ]),
        ),
      );
      try {
        if (cartItems.length) {
          const saved = await saveOrderToHistory({
            menuDate: date,
            orderTotal: total / 100,
            items: cartItems.map((dish) => ({
              id: dish.sourceId,
              name: dish.sourceName,
              weight: dish.weightLabel ?? "",
              quantity: cart[dish.id],
              pricePerUnit: dish.cents / 100,
              totalPrice: Math.round(dish.cents * cart[dish.id]) / 100,
            })),
          });
          setSavedOrders((previous) => [
            saved,
            ...previous.filter((order) => order.menuDate !== date),
          ]);
        } else {
          await removeOrderByMenuDate(date);
          setSavedOrders((previous) =>
            previous.filter((order) => order.menuDate !== date),
          );
        }
        setNotice(t("saved"));
      } catch {
        setNotice(t("historySaveError"));
      }
    } catch (error) {
      const code = error instanceof ApiError ? error.details?.code : null;
      if (code === "order_status_unknown") setUncertain(true);
      setNotice(
        t(
          code === "order_status_unknown"
            ? "resultUnknown"
            : code === "order_date_closed"
              ? "archiveNotice"
              : code === "menu_changed"
                ? "menuChanged"
                : "saveError",
        ),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const allergenBadge = (allergen: DesignAllergen, withText = false) => {
    const Icon = ALLERGEN_ICONS[allergen];
    return (
      <span
        key={allergen}
        className="design-allergen"
        title={t(`allergens.${allergen}`)}
      >
        <Icon size={15} aria-hidden="true" />
        {withText && t(`allergens.${allergen}`)}
      </span>
    );
  };

  const renderCart = (full = false) => (
    <section
      className={`design-cart ${full ? "design-cart-full" : ""}`}
      aria-label={t("myLunch")}
    >
      <div className="design-cart-title">
        <ShoppingBasket size={24} />
        <h2>{t("myLunch")}</h2>
        <span>{dateLabel}</span>
      </div>
      {cartItems.length ? (
        <ul className="design-cart-list">
          {cartItems.map((dish) => (
            <li key={dish.id}>
              {full && dish.photo && (
                <img src={dish.photo} alt="" className="design-cart-photo" />
              )}
              <div className="design-cart-name">
                <strong>{getDishName(dish)}</strong>
                <span>
                  {cart[dish.id]} {t("portions")} ·{" "}
                  {getDishWeight(dish, cart[dish.id])}
                </span>
              </div>
              <strong className="design-price">
                {money(Math.round(dish.cents * cart[dish.id]))}
              </strong>
              <button
                type="button"
                className="design-icon-button"
                disabled={!orderable}
                onClick={() => changeCart(dish.id, 0)}
                aria-label={t("removeDish", { name: getDishName(dish) })}
              >
                <X size={16} />
              </button>
              {full && (
                <div className="design-cart-stepper">
                  <button
                    type="button"
                    disabled={!orderable}
                    onClick={() =>
                      changeCart(dish.id, Math.max(0, cart[dish.id] - 0.5))
                    }
                    aria-label={t("decrease", { name: getDishName(dish) })}
                  >
                    <Minus size={16} />
                  </button>
                  <span>{cart[dish.id]}</span>
                  <button
                    type="button"
                    onClick={() =>
                      changeCart(dish.id, Math.min(20, cart[dish.id] + 0.5))
                    }
                    disabled={!orderable || cart[dish.id] >= 20}
                    aria-label={t("increase", { name: getDishName(dish) })}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="design-cart-empty">
          <ShoppingBasket size={32} />
          <p>{t("emptyCart")}</p>
          <span>{t("emptyCartHint")}</span>
        </div>
      )}
      <div className="design-cart-total">
        <span>{t("total")}</span>
        <strong>{money(total)}</strong>
      </div>
      <button
        type="button"
        className="design-button design-button-rust"
        disabled={full && !orderable}
        onClick={full ? saveOrder : () => navigate("orders")}
      >
        <ShoppingBasket size={18} />
        {t(submitting ? "sending" : full ? "saveOrderLabel" : "reviewOrder")}
        <ArrowRight size={17} />
      </button>
      {full && (
        <p className="design-fineprint">
          {t(
            menuOpen
              ? "saveHint"
              : date > today || dateCanBeOrdered
                ? "notPublished"
                : "archiveNotice",
          )}
        </p>
      )}
    </section>
  );

  return (
    <div className="design-preview">
      <header className="design-header">
        <div className="design-header-inner">
          <button
            type="button"
            className="design-brand"
            onClick={() => navigate("home")}
            aria-label={t("nav.home")}
          >
            <img src="/icon.svg" alt="" />
            <strong>Valgyklos VPM</strong>
          </button>
          <span className="design-brand-divider" />
          <span className="design-lab">
            <Leaf size={23} />
            FOOD DATA LAB
          </span>
          <nav className="design-desktop-nav" aria-label={t("navigation")}>
            {(Object.keys(NAV_ICONS) as Screen[]).map((value) => {
              const Icon = NAV_ICONS[value];
              return (
                <button
                  key={value}
                  type="button"
                  aria-current={screen === value ? "page" : undefined}
                  onClick={() => navigate(value)}
                >
                  <Icon size={17} />
                  {t(`nav.${value}`)}
                  {value === "orders" && cartItems.length > 0 && (
                    <span className="design-count">{cartItems.length}</span>
                  )}
                </button>
              );
            })}
          </nav>
          <DesignNews onReport={() => setModal("feedback")} />
          <button
            type="button"
            className="design-icon-button design-settings"
            onClick={() => setModal("settings")}
            aria-label={t("settings")}
          >
            <Settings2 size={21} />
          </button>
        </div>
      </header>

      <main key={screen} className="design-main design-screen-enter">
        <section className="design-intro">
          <div>
            <h1>
              {screen === "home"
                ? profile?.fullName
                  ? homeText("greeting", { name: profile.fullName })
                  : t("heroTitle")
                : t(`nav.${screen}`)}
              <span className="design-title-dot">.</span>
            </h1>
          </div>
          <div className="design-deadline">
            <div className="design-deadline-main">
              <Clock3 size={31} />
              <div>
                <span>{t("orderUntil")}</span>
                <strong>09:00</strong>
              </div>
              <Leaf className="design-deadline-leaf" size={90} />
            </div>
          </div>
        </section>

        {notice && (
          <div className="design-notice" role="status">
            <Check size={18} />
            <span>{notice}</span>
            <button
              type="button"
              className="design-icon-button"
              onClick={() => setNotice(null)}
              aria-label={t("close")}
            >
              <X size={17} />
            </button>
          </div>
        )}

        {screen !== "history" && (
          <section className="design-week" aria-label={t("weekMenu")}>
            <h2>
              <CalendarDays size={22} />
              {t("weekMenu")}
            </h2>
            <div className="design-week-days">
              <button
                type="button"
                className="design-week-arrow"
                disabled={!canGoBack}
                onClick={() => changeWeek(-1)}
                aria-label={t("previousWeek")}
              >
                <ChevronLeft size={19} />
              </button>
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`design-day ${date === day ? "is-active" : ""}`}
                  onClick={() => {
                    setDate(day);
                    setCategory("all");
                    setSearch("");
                    setNotice(null);
                  }}
                  aria-pressed={date === day}
                  aria-label={formatDate(day, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                >
                  <strong>{formatDate(day, { weekday: "short" })}</strong>
                  <span>
                    {formatDate(day, { day: "2-digit", month: "2-digit" })}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="design-week-arrow"
                disabled={!canGoForward}
                onClick={() => changeWeek(1)}
                aria-label={t("nextWeek")}
              >
                <ChevronRight size={19} />
              </button>
            </div>
          </section>
        )}

        {screen !== "history" && archiveMode === "error" && (
          <div className="design-date-status" role="alert">
            <Info size={17} />
            <span>{t("archiveError")}</span>
            <button
              type="button"
              onClick={() => setArchiveRetry((previous) => previous + 1)}
            >
              {t("retry")}
            </button>
          </div>
        )}
        {screen !== "history" && !menuOpen && archiveMode !== "error" && (
          <div className="design-date-status" role="status">
            <Info size={17} />
            <span>
              {t(
                date > today
                  ? "notPublished"
                  : selectedArchive
                    ? "archiveNotice"
                    : archive.error
                      ? "archiveError"
                      : archive.loading
                        ? "archiveLoading"
                        : "archiveMissing",
              )}
            </span>
            {archive.error && date <= today && (
              <button
                type="button"
                onClick={() => setArchiveRetry((previous) => previous + 1)}
              >
                {t("retry")}
              </button>
            )}
          </div>
        )}

        {screen === "home" && featuredDishes.length > 0 && (
          <div className="design-feature-row">
            <section
              className="design-feature"
              aria-label={t("todayChoice")}
              onMouseEnter={() => setFeaturedPaused(true)}
              onMouseLeave={() => setFeaturedPaused(false)}
              onFocusCapture={() => setFeaturedPaused(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setFeaturedPaused(false);
              }}
            >
              <button
                key={featured.id}
                type="button"
                className="design-feature-image-link"
                onClick={openAvailableMenu}
                aria-label={t("viewAvailableMenu")}
              >
                {featured.photo ? (
                  <img src={featured.photo} alt={getDishName(featured)} />
                ) : (
                  <span className="design-photo-placeholder">
                    <Utensils size={80} aria-hidden="true" />
                  </span>
                )}
              </button>
              <div className="design-feature-shade" />
              <span className="design-feature-badge">
                <span>✦</span>
                {t("todayChoice")}
              </span>
              <div className="design-feature-copy">
                <span className="design-eyebrow">
                  {formatDate(availableDate, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                <h2>
                  <button
                    type="button"
                    className="design-feature-title-link"
                    onClick={openAvailableMenu}
                  >
                    {getDishName(featured)}
                  </button>
                </h2>
                <p>
                  {getDishWeight(featured)}
                  <span />
                  {money(featured.cents)}
                </p>
                <button type="button" onClick={openAvailableMenu}>
                  {t("viewAvailableMenu")}
                  <Plus size={17} />
                </button>
              </div>
              <div className="design-feature-controls">
                <button
                  type="button"
                  aria-label={t("previousDish")}
                  onClick={() =>
                    setFeaturedIndex(
                      (previous) =>
                        (previous + featuredDishes.length - 1) %
                        featuredDishes.length,
                    )
                  }
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label={t("nextDish")}
                  onClick={() => setFeaturedIndex((previous) => previous + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="design-feature-dots" aria-hidden="true">
                {featuredDishes.map((dish, index) => (
                  <span
                    key={dish.id}
                    className={activeFeaturedIndex === index ? "is-active" : ""}
                  />
                ))}
              </div>
            </section>
            {renderCart()}
          </div>
        )}

        {(screen === "home" || screen === "menu") && (
          <section className="design-menu" aria-label={t("dayMenu")}>
            <div className="design-section-heading">
              <h2>
                <Utensils size={22} />
                {t("dayMenu")}
                <span>{dateLabel}</span>
              </h2>
              <button
                type="button"
                className={`design-favorites-filter ${onlyFavorites ? "is-active" : ""}`}
                aria-pressed={onlyFavorites}
                onClick={() => setOnlyFavorites(!onlyFavorites)}
              >
                <Heart
                  size={16}
                  fill={onlyFavorites ? "currentColor" : "none"}
                />
                {t("favorites")}
              </button>
            </div>
            <div className="design-menu-toolbar">
              <div className="design-categories">
                {DESIGN_CATEGORIES.map((value) => {
                  const Icon = CATEGORY_ICONS[value];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      aria-pressed={category === value}
                      className={category === value ? "is-active" : ""}
                    >
                      <Icon size={17} />
                      {t(`categories.${value}`)}
                    </button>
                  );
                })}
              </div>
              <label className="design-search">
                <Search size={17} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t("search")}
                  aria-label={t("search")}
                />
              </label>
            </div>
            {visibleDishes.length ? (
              <ul className="design-dish-grid">
                {visibleDishes.map((dish) => {
                  const name = getDishName(dish);
                  const quantity = quantityFor(dish.id);
                  const added = cart[dish.id] === validQuantity(quantity);
                  return (
                    <li key={dish.id} className="design-dish-card">
                      <div className="design-dish-image">
                        <button
                          type="button"
                          onClick={() => setDetail(dish)}
                          aria-label={t("dishDetails", { name })}
                        >
                          {dish.photo ? (
                            <img src={dish.photo} alt={name} loading="lazy" />
                          ) : (
                            <span className="design-photo-placeholder">
                              <Utensils size={32} aria-hidden="true" />
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          className={`design-heart ${favoritesState.keys.has(favoriteKey(dish.sourceName)) ? "is-active" : ""}`}
                          aria-label={t(
                            favoritesState.keys.has(
                              favoriteKey(dish.sourceName),
                            )
                              ? "removeFavorite"
                              : "addFavorite",
                            { name },
                          )}
                          aria-pressed={favoritesState.keys.has(
                            favoriteKey(dish.sourceName),
                          )}
                          disabled={
                            !favoritesState.ready ||
                            favoritesState.pending.has(
                              favoriteKey(dish.sourceName),
                            )
                          }
                          onClick={() => toggleFavorite(dish.id)}
                        >
                          <Heart
                            size={21}
                            fill={
                              favoritesState.keys.has(
                                favoriteKey(dish.sourceName),
                              )
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                        <span className="design-dish-category">
                          {t(`categories.${dish.category}`)}
                        </span>
                      </div>
                      <div className="design-dish-body">
                        <h3>{name}</h3>
                        <div className="design-dish-meta">
                          <span>{getDishWeight(dish)}</span>
                          <strong>{money(dish.cents)}</strong>
                        </div>
                        <button
                          type="button"
                          className="design-allergen-row"
                          onClick={() => setDetail(dish)}
                          aria-label={t("dishAllergens", { name })}
                        >
                          {dish.allergens ? (
                            dish.allergens.map((allergen) =>
                              allergenBadge(allergen),
                            )
                          ) : (
                            <span className="design-allergen-unknown">
                              <Info size={14} />
                              {t("needsConfirmation")}
                            </span>
                          )}
                          <Info size={13} />
                        </button>
                        <div className="design-portion-label">
                          <span>{t("portionSize")}</span>
                          <label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={quantity}
                              onChange={(event) =>
                                setDrafts((previous) => ({
                                  ...previous,
                                  [dish.id]: event.target.value,
                                }))
                              }
                              aria-label={t("customQuantity", { name })}
                            />
                            <span>{t("portions")}</span>
                          </label>
                        </div>
                        <div
                          className="design-portions"
                          role="group"
                          aria-label={t("chooseQuantity", { name })}
                        >
                          {[0.5, 1, 2].map((value) => (
                            <button
                              type="button"
                              key={value}
                              aria-pressed={
                                Number(quantity.replace(",", ".")) === value
                              }
                              disabled={!orderable}
                              onClick={() =>
                                setDrafts((previous) => ({
                                  ...previous,
                                  [dish.id]: String(value),
                                }))
                              }
                            >
                              <strong>{value === 0.5 ? "½" : value}</strong>
                              <span>{getDishWeight(dish, value)}</span>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className={`design-button ${added ? "design-button-added" : ""}`}
                          disabled={
                            !orderable || validQuantity(quantity) === null
                          }
                          onClick={() => addDish(dish)}
                        >
                          {added ? (
                            <Check size={17} />
                          ) : (
                            <ShoppingBasket size={17} />
                          )}
                          {t(
                            !orderable
                              ? "archiveOnly"
                              : added
                                ? "inLunch"
                                : "addToLunch",
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="design-empty">
                <Search size={28} />
                <h3>
                  {t(
                    !menuDishes.length
                      ? date > today
                        ? "notPublishedTitle"
                        : "archiveEmptyTitle"
                      : "nothingFound",
                  )}
                </h3>
                <p>
                  {t(
                    !menuDishes.length
                      ? date > today
                        ? "notPublished"
                        : "archiveMissing"
                      : "changeFilters",
                  )}
                </p>
                <button
                  type="button"
                  className="design-button"
                  onClick={() => {
                    if (!menuDishes.length) {
                      openAvailableMenu();
                      return;
                    }
                    setCategory("all");
                    setSearch("");
                    setOnlyFavorites(false);
                  }}
                >
                  {t(!menuDishes.length ? "viewAvailableMenu" : "resetFilters")}
                </button>
              </div>
            )}
            <button
              type="button"
              className="design-allergen-legend"
              onClick={() => setModal("allergens")}
            >
              <span>
                <Info size={20} />
                <strong>{t("allergenTitle")}</strong>
              </span>
              {DESIGN_ALLERGENS.map((allergen) =>
                allergenBadge(allergen, true),
              )}
              <ArrowRight size={17} />
            </button>
          </section>
        )}

        {screen === "orders" && (
          <div className="design-order-layout">
            {renderCart(true)}
            <aside className="design-order-note">
              <CalendarDays size={28} />
              <h2>{dateLabel}</h2>
              <p>{t("orderHint")}</p>
              <button
                type="button"
                className="design-button"
                onClick={() => navigate("menu")}
              >
                <Plus size={17} />
                {t("chooseMore")}
              </button>
            </aside>
          </div>
        )}

        {favoritesState.error && (
          <p role="alert" className="design-notice">
            {t("favoritesError")}{" "}
            <button type="button" onClick={favoritesState.reload}>
              {t("retry")}
            </button>
          </p>
        )}
        {screen === "history" && (
          <section className="design-history">
            {historyError ? (
              <div className="design-empty" role="alert">
                {t("historyError")}
                <button
                  type="button"
                  className="design-button"
                  onClick={() => setHistoryRetry((value) => value + 1)}
                >
                  {t("retry")}
                </button>
              </div>
            ) : savedOrders.length ? (
              savedOrders.map((order) => {
                const sum = order.items.reduce(
                  (value, item) => value + Math.round(item.totalPrice * 100),
                  0,
                );
                return (
                  <article key={order.id} className="design-history-card">
                    <span className="design-eyebrow">{t("orderLabel")}</span>
                    <h2>
                      {formatDate(order.menuDate, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </h2>
                    <ul>
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span>{item.name}</span>
                          <strong>× {item.quantity}</strong>
                        </li>
                      ))}
                    </ul>
                    <div className="design-cart-total">
                      <span>{t("total")}</span>
                      <strong>{money(sum)}</strong>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="design-empty">
                <History size={32} />
                <h2>{t("emptyHistory")}</h2>
                <p>{t("emptyHistoryHint")}</p>
                <button
                  type="button"
                  className="design-button"
                  onClick={() => navigate("menu")}
                >
                  {t("nav.menu")}
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </section>
        )}

        {screen === "home" && (
          <section className="design-feedback-card">
            <MessageSquare size={24} aria-hidden="true" />
            <div>
              <h2>{t("feedbackTitle")}</h2>
              <p>{t("feedbackHint")}</p>
            </div>
            <button
              type="button"
              className="design-button"
              onClick={() => setModal("feedback")}
            >
              {t("reportProblem")}
            </button>
          </section>
        )}

        <div className="design-bottom-banners">
          <button
            type="button"
            className="design-about-banner"
            onClick={() => setModal("about")}
          >
            <Info size={29} />
            <span>
              <strong>{t("about")}</strong>
            </span>
            <ArrowRight size={22} />
          </button>
          <button
            type="button"
            className="design-eco-banner"
            onClick={() => setModal("eco")}
          >
            <Leaf size={38} />
            <span>
              <strong>ECO CHOICE</strong>
            </span>
            <ArrowRight size={22} />
          </button>
        </div>
      </main>

      <div className="design-mobile-bottom">
        {cartItems.length > 0 && screen !== "orders" && (
          <button
            type="button"
            className="design-mobile-cart"
            onClick={() => navigate("orders")}
          >
            <ShoppingBasket size={20} />
            <span>
              {t("myLunch")}
              <small>{t("dishCount", { count: cartItems.length })}</small>
            </span>
            <strong>{money(total)}</strong>
            <ArrowRight size={18} />
          </button>
        )}
        <nav aria-label={t("navigation")}>
          {(Object.keys(NAV_ICONS) as Screen[]).map((value) => {
            const Icon = NAV_ICONS[value];
            return (
              <button
                key={value}
                type="button"
                aria-current={screen === value ? "page" : undefined}
                onClick={() => navigate(value)}
              >
                <Icon size={21} />
                <span>{t(`nav.${value}`)}</span>
                {value === "orders" && cartItems.length > 0 && (
                  <i>{cartItems.length}</i>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {(modal || detail) && (
        <DesignDialog
          title={
            detail
              ? getDishName(detail)
              : t(
                  modal === "allergens"
                    ? "allergenTitle"
                    : modal === "about"
                      ? "about"
                      : modal === "eco"
                        ? "ecoTitle"
                        : modal === "feedback"
                          ? "reportProblem"
                          : "settings",
                )
          }
          onClose={closeModal}
        >
          {detail ? (
            <>
              {detail.photo ? (
                <img
                  className="design-detail-photo"
                  src={detail.photo}
                  alt={getDishName(detail)}
                />
              ) : (
                <div className="design-info-art">
                  <Utensils size={45} aria-hidden="true" />
                </div>
              )}
              <div className="design-detail-meta">
                <span>{getDishWeight(detail)}</span>
                <strong>{money(detail.cents)}</strong>
              </div>
              <h3>{t("allergenTitle")}</h3>
              <div className="design-detail-allergens">
                {detail.allergens ? (
                  detail.allergens.map((allergen) =>
                    allergenBadge(allergen, true),
                  )
                ) : (
                  <p>{t("unknownAllergens")}</p>
                )}
              </div>
              <p className="design-fineprint">{t("allergenNote")}</p>
              <button
                type="button"
                className="design-button"
                disabled={
                  !orderable || validQuantity(quantityFor(detail.id)) === null
                }
                onClick={() => {
                  addDish(detail);
                  closeModal();
                }}
              >
                <ShoppingBasket size={17} />
                {t(orderable ? "addToLunch" : "archiveOnly")}
              </button>
            </>
          ) : modal === "feedback" ? (
            <DesignFeedbackForm onPendingChange={onFeedbackPending} />
          ) : modal === "allergens" ? (
            <>
              <p>{t("allergenDescription")}</p>
              <div className="design-allergen-definitions">
                {DESIGN_ALLERGENS.map((allergen) =>
                  allergenBadge(allergen, true),
                )}
              </div>
              <p className="design-fineprint">{t("allergenNote")}</p>
            </>
          ) : modal === "settings" ? (
            <>
              <button
                type="button"
                className="design-settings-brand"
                aria-label={t("admin")}
                onClick={() => {
                  const now = Date.now();
                  adminTaps.current.count =
                    now - adminTaps.current.last < 3000
                      ? adminTaps.current.count + 1
                      : 1;
                  adminTaps.current.last = now;
                  if (adminTaps.current.count >= 5) {
                    closeModal();
                    router.push("/admin");
                  }
                }}
              >
                Valgyklos VPM
              </button>
              <p>{t("language")}</p>
              <LanguageSwitcher variant="panel" />
              <DesignThemeSwitcher />
              <InterfaceSwitcher onChange={closeModal} />
              <NotificationSettings />
              {isAdmin && (
                <Link href="/admin" className="design-button">
                  {t("admin")}
                </Link>
              )}
              <button type="button" className="design-button" onClick={logout}>
                {t("logout")}
              </button>
            </>
          ) : (
            <DesignContent
              key={modal}
              section={modal === "eco" ? "eco" : "about"}
            />
          )}
        </DesignDialog>
      )}
      <div id="design-dialog-root" />
    </div>
  );
}
