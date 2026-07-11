
const prisma = require('../db/prisma');
const STATES = require('./states');

const naira = (kobo) => `₦${(kobo / 100).toLocaleString()}`;


function reply(state, text, options = []) {
  return {
    state,
    messages: [{ type: 'bot', text }],
    options,
  };
}

async function getOrCreateSession(deviceId) {
  return prisma.session.upsert({
    where: { deviceId },
    update: {},
    create: { deviceId, state: STATES.MAIN_MENU, cart: [] },
  });
}

function mainMenuReply() {
  return reply(
    STATES.MAIN_MENU,
    'Welcome to ChopChat! What would you like to do?',
    [
      { value: '1', label: 'Place an order' },
      { value: '99', label: 'Checkout order' },
      { value: '98', label: 'See order history' },
      { value: '97', label: 'See current order' },
      { value: '0', label: 'Cancel order' },
    ]
  );
}

async function menuListReply() {
  const items = await prisma.menuItem.findMany({
    where: { available: true },
    orderBy: { name: 'asc' },
  });
  const options = items.map((item, i) => ({
    value: String(i + 1),
    label: `${item.name} - ${naira(item.price)}`,
  }));
  return {
    ...reply(STATES.BROWSING_CATEGORY, 'Here is our menu. Select an item:', options),

    _context: { itemIds: items.map((i) => i.id) },
  };
}

function optionStepReply(menuItem, cartDraft) {
  const stepIndex = cartDraft.optionStepIndex;
  const optionGroups = menuItem.options || [];

  if (stepIndex >= optionGroups.length) {
    // all option groups answered -> ask quantity
    return reply(
      STATES.AWAITING_QUANTITY,
      `How many plates "${menuItem.name}" would you like? (type a number)`
    );
  }

  const group = optionGroups[stepIndex];
  const options = group.choices.map((choice, i) => ({
    value: String(i + 1),
    label: choice.priceDelta
      ? `${choice.label} (${choice.priceDelta > 0 ? '+' : ''}${naira(choice.priceDelta)})`
      : choice.label,
  }));

  return reply(STATES.SELECTING_OPTIONS, `Choose ${group.name}:`, options);
}

function cartReviewReply(cart) {
  const total = cart.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const lines = cart
    .map((line) => `${line.qty}x ${line.name} - ${naira(line.unitPrice * line.qty)}`)
    .join('\n');

  return reply(
    STATES.CART_REVIEW,
    `Added to cart!\n\n${lines}\n\nTotal so far: ${naira(total)}\n\nWhat next?`,
    [
      { value: '1', label: 'Add another item' },
      { value: '99', label: 'Checkout' },
      { value: '0', label: 'Cancel order' },
    ]
  );
}


async function handleMessage(deviceId, rawInput) {
  const session = await getOrCreateSession(deviceId);
  const input = String(rawInput).trim();
  const cart = session.cart || [];
  const context = session.context || {};

  
  if (input === '0' && session.state !== STATES.MAIN_MENU) {
    await prisma.session.update({
      where: { deviceId },
      data: { state: STATES.MAIN_MENU, cart: [], context: null },
    });
    return mainMenuReply();
  }

  switch (session.state) {
   
    case STATES.MAIN_MENU: {
      if (input === '1') {
        const menuReply = await menuListReply();
        await prisma.session.update({
          where: { deviceId },
          data: { state: menuReply.state, context: menuReply._context },
        });
        return menuReply;
      }

      if (input === '99') {
        if (cart.length === 0) {
          return reply(STATES.MAIN_MENU, 'No order to place.', [
            { value: '1', label: 'Place a new order' },
          ]);
        }
        const total = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
        const order = await prisma.order.create({
          data: { deviceId, items: cart, total, status: 'PENDING' },
        });
        await prisma.session.update({
          where: { deviceId },
          data: { cart: [], context: { pendingOrderId: order.id } },
        });
        return reply(
          STATES.MAIN_MENU,
          `Order placed! Total: ${naira(total)}.\n\nReady to pay?`,
          [
            { value: 'PAY', label: `Pay ${naira(total)}` },
            { value: '1', label: 'Place another order' },
          ]
        );
      }

      if (input === '98') {
        const orders = await prisma.order.findMany({
          where: { deviceId, status: 'PAID' },
          orderBy: { createdAt: 'desc' },
        });
        if (orders.length === 0) {
          return reply(STATES.MAIN_MENU, 'You have no past orders yet.', [
            { value: '1', label: 'Place an order' },
          ]);
        }
        const text = orders
          .map(
            (o, i) =>
              `${i + 1}. ${naira(o.total)} - ${new Date(o.createdAt).toLocaleDateString()}`
          )
          .join('\n');
        return reply(STATES.MAIN_MENU, `Order history:\n\n${text}`, [
          { value: '1', label: 'Place a new order' },
        ]);
      }

      if (input === '97') {
        if (cart.length === 0) {
          return reply(STATES.MAIN_MENU, 'You have no current order in progress.', [
            { value: '1', label: 'Place an order' },
          ]);
        }
        return cartReviewReply(cart);
      }

      // anything else while at main menu -> just re-show it
      return mainMenuReply();
    }

   
    case STATES.BROWSING_CATEGORY: {
      const itemIds = context.itemIds || [];
      const chosenId = itemIds[Number(input) - 1];

      if (!chosenId) {
   
        const menuReply = await menuListReply();
        await prisma.session.update({
          where: { deviceId },
          data: { context: menuReply._context },
        });
        return menuReply;
      }

      const menuItem = await prisma.menuItem.findUnique({ where: { id: chosenId } });
      const draftContext = {
        draftItemId: menuItem.id,
        optionStepIndex: 0,
        selectedOptions: [],
      };

   
      const nextReply = optionStepReply(menuItem, draftContext);
      await prisma.session.update({
        where: { deviceId },
        data: { state: nextReply.state, context: draftContext },
      });
      return nextReply;
    }

   
    case STATES.SELECTING_OPTIONS: {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: context.draftItemId },
      });
      const optionGroups = menuItem.options || [];
      const group = optionGroups[context.optionStepIndex];
      const choice = group.choices[Number(input) - 1];

      if (!choice) return optionStepReply(menuItem, context); // invalid, re-ask

      const updatedContext = {
        ...context,
        optionStepIndex: context.optionStepIndex + 1,
        selectedOptions: [
          ...context.selectedOptions,
          { group: group.name, choice: choice.label, priceDelta: choice.priceDelta },
        ],
      };

      await prisma.session.update({ where: { deviceId }, data: { context: updatedContext } });

      const nextReply = optionStepReply(menuItem, updatedContext);
      if (nextReply.state === STATES.AWAITING_QUANTITY) {
        await prisma.session.update({
          where: { deviceId },
          data: { state: STATES.AWAITING_QUANTITY },
        });
      }
      return nextReply;
    }

    
    case STATES.AWAITING_QUANTITY: {
      const qty = parseInt(input, 10);
      if (!qty || qty < 1) {
        return reply(STATES.AWAITING_QUANTITY, 'Please enter a valid quantity (e.g. 1, 2, 3):');
      }

      const menuItem = await prisma.menuItem.findUnique({
        where: { id: context.draftItemId },
      });
      const optionsTotal = context.selectedOptions.reduce((s, o) => s + o.priceDelta, 0);
      const unitPrice = menuItem.price + optionsTotal;

      const newCart = [
        ...cart,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          unitPrice,
          qty,
          selectedOptions: context.selectedOptions,
        },
      ];

      await prisma.session.update({
        where: { deviceId },
        data: { state: STATES.CART_REVIEW, cart: newCart, context: null },
      });

      return cartReviewReply(newCart);
    }


    case STATES.CART_REVIEW: {
      if (input === '1') {
        const menuReply = await menuListReply();
        await prisma.session.update({
          where: { deviceId },
          data: { state: menuReply.state, context: menuReply._context },
        });
        return menuReply;
      }
      if (input === '99') {
        const total = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
        const order = await prisma.order.create({
          data: { deviceId, items: cart, total, status: 'PENDING' },
        });
        await prisma.session.update({
          where: { deviceId },
          data: { state: STATES.MAIN_MENU, cart: [], context: { pendingOrderId: order.id } },
        });
        return reply(STATES.MAIN_MENU, `Order placed! Total: ${naira(total)}.\n\nReady to pay?`, [
          { value: 'PAY', label: `Pay ${naira(total)}` },
        ]);
      }
      return cartReviewReply(cart);
    }

    default:
      return mainMenuReply();
  }
}

module.exports = { handleMessage, getOrCreateSession };