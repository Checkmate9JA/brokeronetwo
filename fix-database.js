const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase credentials here
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Use service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabase() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check if preferred_currency column exists
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      throw new Error(`Failed to check columns: ${columnsError.message}`);
    }
    
    const hasPreferredCurrency = columns.some(col => col.column_name === 'preferred_currency');
    
    if (hasPreferredCurrency) {
      console.log('✅ preferred_currency column already exists');
      return;
    }
    
    console.log('❌ preferred_currency column missing. Adding it...');
    
    // Add the column using raw SQL
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.users 
        ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'USD';
      `
    });
    
    if (alterError) {
      console.log('⚠️ Direct SQL failed, trying alternative approach...');
      
      // Alternative: Try to update existing users to set a default value
      // This might fail if the column doesn't exist, but it's worth trying
      const { error: updateError } = await supabase
        .from('users')
        .update({ preferred_currency: 'USD' })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all users
      
      if (updateError) {
        throw new Error(`Failed to add column: ${updateError.message}`);
      }
    }
    
    console.log('✅ preferred_currency column added successfully');
    
    // Verify the column was added
    const { data: newColumns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');
    
    if (verifyError) {
      throw new Error(`Failed to verify: ${verifyError.message}`);
    }
    
    const nowHasPreferredCurrency = newColumns.some(col => col.column_name === 'preferred_currency');
    
    if (nowHasPreferredCurrency) {
      console.log('✅ Column verification successful');
      
      // Set default values for existing users
      const { error: defaultError } = await supabase
        .from('users')
        .update({ preferred_currency: 'USD' })
        .is('preferred_currency', null);
      
      if (defaultError) {
        console.log('⚠️ Warning: Could not set default values:', defaultError.message);
      } else {
        console.log('✅ Default values set for existing users');
      }
      
    } else {
      throw new Error('Column was not added successfully');
    }
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    console.error('Full error:', error);
    
    console.log('\n🔧 Manual Fix Required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL editor');
    console.log('3. Run this SQL:');
    console.log(`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD';
      
      UPDATE public.users 
      SET preferred_currency = 'USD' 
      WHERE preferred_currency IS NULL;
    `);
  }
}

// Run the fix
fixDatabase().then(() => {
  console.log('🎉 Database fix completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Database fix failed:', error);
  process.exit(1);
});
