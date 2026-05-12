const router = require('express').Router();
const prisma  = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { success, badRequest, error } = require('../utils/response');

const REWARDS_CATALOG = [
  { id: 'r-001', name: 'Premium Course Voucher',   description: 'Access any premium course for 30 days',       cost: 500,  category: 'learning',     icon: 'graduation-cap' },
  { id: 'r-002', name: 'Featured Profile Badge',    description: 'Get featured in employer searches for 7 days', cost: 300,  category: 'visibility',   icon: 'star' },
  { id: 'r-003', name: 'Resume Review',             description: 'Professional resume review by an expert',      cost: 750,  category: 'career',       icon: 'file-alt' },
  { id: 'r-004', name: 'Mock Interview Session',    description: '1-hour mock interview with feedback',          cost: 1000, category: 'career',       icon: 'comments' },
  { id: 'r-005', name: 'SkillHub T-Shirt',          description: 'Official SkillHub merchandise',                cost: 200,  category: 'merchandise',  icon: 'tshirt' },
  { id: 'r-006', name: 'Lifetime Certificate Badge',description: 'Permanent gold badge on your profile',        cost: 2000, category: 'prestige',     icon: 'award' },
];

router.get('/merit-coins', authenticate, async (req, res) => {
  try {
    const history = await prisma.transaction.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20 });
    return success(res, { balance: req.user.meritCoins, history });
  } catch (err) { return error(res, 'Failed to fetch coins'); }
});

router.get('/', authenticate, (req, res) => success(res, { catalog: REWARDS_CATALOG, balance: req.user.meritCoins }));

router.get('/transactions', authenticate, async (req, res) => {
  try {
    const txs = await prisma.transaction.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    return success(res, txs);
  } catch (err) { return error(res, 'Failed to fetch transactions'); }
});

router.post('/:id/redeem', authenticate, async (req, res) => {
  const reward = REWARDS_CATALOG.find(r => r.id === req.params.id);
  if (!reward) return badRequest(res, 'Reward not found');

  const balance = req.user.meritCoins || 0;
  if (balance < reward.cost) return badRequest(res, `Insufficient Merit Coins. Need ${reward.cost - balance} more.`);

  try {
    const newBalance = balance - reward.cost;
    await prisma.user.update({ where: { id: req.user.id }, data: { meritCoins: newBalance } });
    const transaction = await prisma.transaction.create({
      data: { userId: req.user.id, type: 'redeem', amount: -reward.cost, description: `Redeemed: ${reward.name}`, balanceAfter: newBalance },
    });
    await prisma.notification.create({ data: { userId: req.user.id, type: 'success', icon: 'gift', title: 'Reward Redeemed!', message: `You redeemed ${reward.name} for ${reward.cost} coins` } });
    return success(res, { reward, newBalance, transaction }, `${reward.name} redeemed successfully!`);
  } catch (err) { return error(res, 'Redemption failed'); }
});

module.exports = router;
