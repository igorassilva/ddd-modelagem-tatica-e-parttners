import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create({
      id: entity.id,
      customer_id: entity.customerId,
      total: entity.total(),
      items: entity.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity
      }))
    },
    {
      include: [{ model: OrderItemModel }]
    });
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update({
      id: entity.id,
      customer_id: entity.customerId,
      total: entity.total()
    },
    {
      where: {
        id: entity.id
      }
    });

    for (const item of entity.items) {
      const [, created] = await OrderItemModel.findOrCreate({
        where: {
          id: item.id
        },
        defaults: {
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          order_id: entity.id,
          quantity: item.quantity
        }
      });

      if (created) continue;

      await OrderItemModel.update({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity
      },
      {
        where: {
          id: item.id
        }
      });
    }
  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findByPk(id, { include: [{ model: OrderItemModel }]});

    const items = orderModel.items.map(item => {
      const orderItem = new OrderItem(
        item.id, 
        item.name, 
        item.price, 
        item.product_id, 
        item.quantity
      );
      return orderItem;
    });

    return new Order(
      orderModel.id, 
      orderModel.customer_id, 
      items);
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({ include: [{ model: OrderItemModel }]});

    const orders = orderModels.map(orderModel => {
      const items = orderModel.items.map(item => {
        const orderItem = new OrderItem(
          item.id, 
          item.name, 
          item.price, 
          item.product_id, 
          item.quantity
        );
        return orderItem;
      });

      const order = new Order(orderModel.id, orderModel.customer_id, items);
      return order;
    });

    return orders;
  }
}