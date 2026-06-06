SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
 
UPDATE notifications n
JOIN connections c ON c.requester_id = n.user_id AND c.status = 'ACCEPTED'
JOIN users u ON u.id = c.receiver_id
SET n.message = CONCAT(u.full_name, ' đã chấp nhận lời mời kết nối của bạn')
WHERE n.type = 'CONNECTION_ACCEPTED';
 
UPDATE notifications n
JOIN connections c ON c.receiver_id = n.user_id
JOIN users u ON u.id = c.requester_id
SET n.message = CONCAT(u.full_name, ' đã gửi lời mời kết nối với bạn')
WHERE n.type = 'CONNECTION_REQUEST';
 
SELECT id, type, message FROM notifications 
WHERE type IN ('CONNECTION_ACCEPTED', 'CONNECTION_REQUEST') 
LIMIT 5;
 