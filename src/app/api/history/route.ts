import { auditMutation } from "@/server/activity";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { orderHistory, type OrderItem } from "@/server/db/schema";
import { formatOrder, getOrderHistory } from "@/server/queries/history";
import { requireIdentity } from "@/server/auth";
import {
  HttpError,
  errorResponse,
  json,
  noContent,
  parse,
  readJson,
} from "@/server/http";
import { orderPatchSchema, orderSaveSchema } from "@/lib/validators";

const round2 = (value: number): number => Number(value.toFixed(2));

const snapQuantity = (value: number): number =>
  Math.max(0, Math.round(value * 2) / 2);

export async function GET(request: Request): Promise<Response> {
  try {
    const username = await requireIdentity(request);
    return json(await getOrderHistory(username));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const username = await requireIdentity(request);
    const input = parse(orderSaveSchema, body);

    const [row] = await auditMutation(
      db
        .insert(orderHistory)
        .values({
          id: crypto.randomUUID(),
          username,
          menuDate: input.menuDate,
          items: input.items,
          orderTotal: String(input.orderTotal),
        })
        .onConflictDoUpdate({
          target: [orderHistory.username, orderHistory.menuDate],
          set: {
            items: input.items,
            orderTotal: String(input.orderTotal),
            updatedAt: new Date(),
          },
        })
        .returning(),
      {
        username,
        category: "orders",
        action: "history_save",
        target: input.menuDate,
        details: {
          ...input,
          source: "client_history",
        },
      }
    );

    return json(formatOrder(row));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const username = await requireIdentity(request);
    const input = parse(orderPatchSchema, body);

    const scope = and(
      eq(orderHistory.username, username),
      eq(orderHistory.menuDate, input.menuDate)
    );

    const [order] = await db
      .select({ items: orderHistory.items })
      .from(orderHistory)
      .where(scope)
      .limit(1);

    if (!order) throw new HttpError(404, "Order not found");

    const quantity = snapQuantity(input.nextQuantity);
    const nextItems = (Array.isArray(order.items) ? order.items : []).reduce<
      OrderItem[]
    >((acc, item) => {
      if (String(item.id) !== String(input.itemId)) {
        acc.push(item);
        return acc;
      }
      if (quantity <= 0) return acc;

      const pricePerUnit = Number(item.pricePerUnit) || 0;
      acc.push({
        ...item,
        quantity,
        totalPrice: round2(pricePerUnit * quantity),
      });
      return acc;
    }, []);

    if (nextItems.length === 0) {
      await auditMutation(
        db.delete(orderHistory).where(scope),
        {
          username,
          category: "orders",
          action: "history_update",
          target: input.menuDate,
          details: {
            itemId: input.itemId,
            nextQuantity: quantity,
            items: nextItems,
          },
        }
      );
      return noContent();
    }

    const nextTotal = nextItems.reduce(
      (sum, item) => sum + (Number(item.totalPrice) || 0),
      0
    );

    const [row] = await auditMutation(
      db
        .update(orderHistory)
        .set({
          items: nextItems,
          orderTotal: String(round2(nextTotal)),
          updatedAt: new Date(),
        })
        .where(scope)
        .returning(),
      {
        username,
        category: "orders",
        action: "history_update",
        target: input.menuDate,
        details: {
          itemId: input.itemId,
          nextQuantity: quantity,
          items: nextItems,
        },
      }
    );

    return json(formatOrder(row));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const username = await requireIdentity(request);
    const menuDate = new URL(request.url).searchParams.get("menuDate");

    await auditMutation(
      db
        .delete(orderHistory)
        .where(
          menuDate
            ? and(
                eq(orderHistory.username, username),
                eq(orderHistory.menuDate, menuDate)
              )
            : eq(orderHistory.username, username)
        ),
      {
        username,
        category: "orders",
        action: "history_delete",
        target: menuDate,
        details: {

        },
      }
    );

    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}
