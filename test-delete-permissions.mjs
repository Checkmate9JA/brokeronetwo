import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeletePermissions() {
  console.log('🔍 Testing delete permissions for wallet_submissions table...');
  
  try {
    // First, let's see what's in the table
    const { data: submissions, error: fetchError } = await supabase
      .from('wallet_submissions')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Error fetching submissions:', fetchError);
      return;
    }
    
    console.log('📋 Found submissions:', submissions?.length || 0);
    if (submissions && submissions.length > 0) {
      console.log('📝 Sample submission:', {
        id: submissions[0].id,
        user_email: submissions[0].user_email,
        wallet_name: submissions[0].wallet_name,
        status: submissions[0].status
      });
      
      // Try to delete the first submission
      const submissionToDelete = submissions[0];
      console.log('🗑️ Attempting to delete submission:', submissionToDelete.id);
      
      const { error: deleteError } = await supabase
        .from('wallet_submissions')
        .delete()
        .eq('id', submissionToDelete.id);
      
      if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
        console.error('🔍 Error details:', {
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint
        });
      } else {
        console.log('✅ Delete successful!');
        
        // Verify deletion
        const { data: verifyData, error: verifyError } = await supabase
          .from('wallet_submissions')
          .select('*')
          .eq('id', submissionToDelete.id);
        
        if (verifyError) {
          console.error('❌ Verification query failed:', verifyError);
        } else if (verifyData && verifyData.length > 0) {
          console.log('⚠️ Submission still exists after deletion:', verifyData);
        } else {
          console.log('✅ Submission successfully deleted and verified');
        }
      }
    } else {
      console.log('ℹ️ No submissions found to test deletion');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDeletePermissions();
