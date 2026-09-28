const pool = require('../db');

const auditLog = (action) => {
    return async (req, res, next) => {
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const userId = req.user ? req.user.id : null;
                    const parcelId = req.body.parcel_id || req.params.id || null;
                    const documentId = req.body.document_id || null;
                    
                    if (userId) {
                        await pool.query(
                            `INSERT INTO workflow_logs (actor_id, parcel_id, document_id, action, remarks) 
                             VALUES ($1, $2, $3, $4, $5)`,
                            [userId, parcelId, documentId, action, req.body.remarks || '']
                        );
                    }
                } catch (error) {
                    console.error('Audit log failed:', error);
                }
            }
        });
        next();
    };
};

module.exports = { auditLog };
