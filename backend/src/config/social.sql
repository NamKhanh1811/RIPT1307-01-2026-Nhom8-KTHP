USE internhub;

CREATE TABLE IF NOT EXISTS connections (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  requester_id  INT NOT NULL,
  receiver_id   INT NOT NULL,
  status        ENUM('PENDING','ACCEPTED','REJECTED','BLOCKED') NOT NULL DEFAULT 'PENDING',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_connection (requester_id, receiver_id),
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id)  REFERENCES users(id) ON DELETE CASCADE,
  CHECK (requester_id <> receiver_id)
);


CREATE TABLE IF NOT EXISTS conversations (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  user1_id      INT NOT NULL,
  user2_id      INT NOT NULL,
  last_message  TEXT,
  last_message_at TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_conversation (user1_id, user2_id),
  FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (user1_id < user2_id)   
);


CREATE TABLE IF NOT EXISTS messages (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id   INT NOT NULL,
  sender_id         INT NOT NULL,
  content           TEXT NOT NULL,
  is_read           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)       REFERENCES users(id) ON DELETE CASCADE
);


CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_receiver  ON connections(receiver_id);
CREATE INDEX idx_connections_status    ON connections(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread       ON messages(conversation_id, is_read);

ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'APPLY_SUCCESS',
    'APPLICATION_APPROVED',
    'APPLICATION_REJECTED',
    'NEW_APPLICANT',
    'CONNECTION_REQUEST',
    'CONNECTION_ACCEPTED',
    'NEW_MESSAGE'
  ) NOT NULL;