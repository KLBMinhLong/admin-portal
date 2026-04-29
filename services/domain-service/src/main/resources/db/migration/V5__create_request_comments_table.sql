CREATE TABLE request_comments (
    id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL,
    author_username VARCHAR(100) NOT NULL,
    author_role VARCHAR(100),
    content TEXT NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT fk_request_comments_request_id FOREIGN KEY (request_id) REFERENCES purchasing_requests(id) ON DELETE CASCADE
);

CREATE INDEX idx_request_comments_request_id ON request_comments(request_id);
