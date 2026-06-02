import { findOne, execute } from '../repositories/dataRepository.js';

export const VIP_THRESHOLD_AMOUNT = 10000;

export function calculatePoints(finalAmount) {
  return Math.floor(Number(finalAmount || 0) / 100);
}

export async function getAnnualSpending(customerId, connection) {
  const row = await findOne(
    `
    SELECT COALESCE(SUM(final_amount), 0) AS annual_spending
    FROM service_transactions
    WHERE customer_id = ?
      AND paid_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
    `,
    [customerId],
    connection,
  );

  return Number(row?.annual_spending || 0);
}

export async function refreshMembershipTier(customerId, connection) {
  const annualSpending = await getAnnualSpending(customerId, connection);

  if (annualSpending >= VIP_THRESHOLD_AMOUNT) {
    await execute(
      `
      UPDATE users
      SET
        membership_tier = 'vip',
        vip_expires_at = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
      WHERE id = ?
      `,
      [customerId],
      connection,
    );

    return {
      membership_tier: 'vip',
      annual_spending: annualSpending,
      remaining_to_vip: 0,
    };
  }

  await execute(
    `
    UPDATE users
    SET
      membership_tier = 'general',
      vip_expires_at = NULL
    WHERE id = ?
    `,
    [customerId],
    connection,
  );

  return {
    membership_tier: 'general',
    annual_spending: annualSpending,
    remaining_to_vip: Math.max(VIP_THRESHOLD_AMOUNT - annualSpending, 0),
  };
}

export async function applyPointChange({ customerId, pointsUsed, pointsEarned }, connection) {
  await execute(
    `
    UPDATE users
    SET membership_points = GREATEST(membership_points - ? + ?, 0)
    WHERE id = ?
    `,
    [pointsUsed, pointsEarned, customerId],
    connection,
  );
}

export async function rollbackPreviousTransactionPoints(
  { customerId, oldPointsUsed, oldPointsEarned },
  connection,
) {
  await execute(
    `
    UPDATE users
    SET membership_points = membership_points + ? - ?
    WHERE id = ?
    `,
    [oldPointsUsed, oldPointsEarned, customerId],
    connection,
  );
}
