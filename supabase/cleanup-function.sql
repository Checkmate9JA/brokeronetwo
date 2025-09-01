-- Cleanup function for social proof activities
-- This function removes old activities and can be called from the Super Admin UI

CREATE OR REPLACE FUNCTION cleanup_old_social_proof_activities()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete activities older than 30 days
    DELETE FROM social_proof_activities 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (Super Admins)
GRANT EXECUTE ON FUNCTION cleanup_old_social_proof_activities TO authenticated;
