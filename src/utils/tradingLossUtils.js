import { supabase } from '@/lib/supabase';

/**
 * Get trading loss settings from admin_settings table
 * @returns {Promise<object>} Trading loss configuration
 */
export const getTradingLossSettings = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['user_loss_percentage', 'enforce_user_loss_percentage', 'global_loss_control']);

    if (error) {
      console.warn('Error fetching trading loss settings:', error);
      return getDefaultLossSettings();
    }

    const settings = {
      userLossPercentage: 3,
      enforceUserLoss: true,
      globalLossControl: true
    };

    data?.forEach(setting => {
      if (setting.setting_key === 'user_loss_percentage') {
        settings.userLossPercentage = parseFloat(setting.setting_value) || 3;
      } else if (setting.setting_key === 'enforce_user_loss_percentage') {
        settings.enforceUserLoss = setting.setting_value === 'true';
      } else if (setting.setting_key === 'global_loss_control') {
        settings.globalLossControl = setting.setting_value === 'true';
      }
    });

    return settings;
  } catch (error) {
    console.warn('Error in getTradingLossSettings:', error);
    return getDefaultLossSettings();
  }
};

/**
 * Get default trading loss settings
 * @returns {object} Default settings
 */
const getDefaultLossSettings = () => ({
  userLossPercentage: 3,
  enforceUserLoss: true,
  globalLossControl: true
});

/**
 * Calculate trading loss for a position
 * @param {number} investmentAmount - User's investment amount
 * @param {number} leverage - Position leverage
 * @param {number} timeInMinutes - Time position has been open in minutes
 * @param {object} lossSettings - Trading loss settings
 * @returns {object} Loss calculation result
 */
export const calculateTradingLoss = (investmentAmount, leverage = 1, timeInMinutes = 0, lossSettings = null) => {
  if (!lossSettings) {
    return {
      lossAmount: 0,
      lossPercentage: 0,
      remainingAmount: investmentAmount,
      isLossActive: false
    };
  }

  const { userLossPercentage, enforceUserLoss, globalLossControl } = lossSettings;

  // Check if loss control is active
  if (!globalLossControl || !enforceUserLoss) {
    return {
      lossAmount: 0,
      lossPercentage: 0,
      remainingAmount: investmentAmount,
      isLossActive: false
    };
  }

  // Calculate loss rate: 0.02% per minute (as per the UI description)
  const lossRatePerMinute = 0.02;
  const maxLossPercentage = userLossPercentage;
  
  // Calculate current loss percentage based on time
  const currentLossPercentage = Math.min(timeInMinutes * lossRatePerMinute, maxLossPercentage);
  
  // Calculate actual loss amount
  const lossAmount = (investmentAmount * currentLossPercentage) / 100;
  const remainingAmount = investmentAmount - lossAmount;

  return {
    lossAmount: Math.round(lossAmount * 100) / 100, // Round to 2 decimal places
    lossPercentage: currentLossPercentage,
    remainingAmount: Math.round(remainingAmount * 100) / 100,
    isLossActive: true,
    maxLossPercentage,
    timeInMinutes
  };
};

/**
 * Apply trading loss to a user's position
 * @param {string} positionId - Position ID
 * @param {string} userId - User ID
 * @param {number} investmentAmount - Investment amount
 * @param {number} leverage - Position leverage
 * @param {number} timeInMinutes - Time position has been open
 * @returns {Promise<object>} Updated position with loss applied
 */
export const applyTradingLossToPosition = async (positionId, userId, investmentAmount, leverage = 1, timeInMinutes = 0) => {
  try {
    // Get current loss settings
    const lossSettings = await getTradingLossSettings();
    
    // Calculate loss
    const lossCalculation = calculateTradingLoss(investmentAmount, leverage, timeInMinutes, lossSettings);
    
    if (!lossCalculation.isLossActive) {
      console.log('Trading loss not active for position:', positionId);
      return { positionId, lossApplied: false };
    }

    // Update position with loss information
    const { error } = await supabase
      .from('trading_positions') // Adjust table name as needed
      .update({
        current_loss: lossCalculation.lossAmount,
        loss_percentage: lossCalculation.lossPercentage,
        remaining_balance: lossCalculation.remainingAmount,
        last_loss_update: new Date().toISOString()
      })
      .eq('id', positionId);

    if (error) {
      console.error('Error updating position with loss:', error);
      throw error;
    }

    console.log(`Applied trading loss to position ${positionId}:`, lossCalculation);
    
    return {
      positionId,
      lossApplied: true,
      lossCalculation
    };

  } catch (error) {
    console.error('Error applying trading loss:', error);
    throw error;
  }
};

/**
 * Process trading loss for all active positions
 * This function should be called periodically (e.g., every minute)
 */
export const processAllActivePositions = async () => {
  try {
    const lossSettings = await getTradingLossSettings();
    
    if (!lossSettings.globalLossControl || !lossSettings.enforceUserLoss) {
      console.log('Trading loss control is disabled');
      return;
    }

    // Get all active positions
    const { data: positions, error } = await supabase
      .from('trading_positions') // Adjust table name as needed
      .select('id, user_id, investment_amount, leverage, created_at, status')
      .eq('status', 'open');

    if (error) {
      console.error('Error fetching active positions:', error);
      return;
    }

    const now = new Date();
    let processedCount = 0;

    for (const position of positions) {
      try {
        const timeInMinutes = Math.floor((now - new Date(position.created_at)) / (1000 * 60));
        
        if (timeInMinutes > 0) { // Only process positions that have been open for at least 1 minute
          await applyTradingLossToPosition(
            position.id,
            position.user_id,
            position.investment_amount,
            position.leverage || 1,
            timeInMinutes
          );
          processedCount++;
        }
      } catch (positionError) {
        console.error(`Error processing position ${position.id}:`, positionError);
      }
    }

    console.log(`Processed trading loss for ${processedCount} active positions`);

  } catch (error) {
    console.error('Error processing all active positions:', error);
  }
};

/**
 * Get user's total trading loss for a specific period
 * @param {string} userId - User ID
 * @param {Date} startDate - Start date for calculation
 * @param {Date} endDate - End date for calculation
 * @returns {Promise<object>} Total loss summary
 */
export const getUserTradingLossSummary = async (userId, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('trading_positions') // Adjust table name as needed
      .select('current_loss, loss_percentage, investment_amount, created_at, closed_at')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching user trading loss summary:', error);
      return { totalLoss: 0, totalInvestment: 0, averageLossPercentage: 0 };
    }

    let totalLoss = 0;
    let totalInvestment = 0;
    let positionCount = 0;

    data?.forEach(position => {
      totalLoss += position.current_loss || 0;
      totalInvestment += position.investment_amount || 0;
      if (position.current_loss > 0) positionCount++;
    });

    const averageLossPercentage = positionCount > 0 ? (totalLoss / totalInvestment) * 100 : 0;

    return {
      totalLoss: Math.round(totalLoss * 100) / 100,
      totalInvestment: Math.round(totalInvestment * 100) / 100,
      averageLossPercentage: Math.round(averageLossPercentage * 100) / 100,
      positionCount
    };

  } catch (error) {
    console.error('Error in getUserTradingLossSummary:', error);
    return { totalLoss: 0, totalInvestment: 0, averageLossPercentage: 0, positionCount: 0 };
  }
};
