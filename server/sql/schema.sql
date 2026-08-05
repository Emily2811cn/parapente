CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY,
  client_name VARCHAR(120) NOT NULL,
  birthday DATE,
  flight_date DATE NOT NULL,
  sender VARCHAR(120) NOT NULL DEFAULT 'ECUADOR PARAPENTE',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS invitations_created_at_idx ON invitations (created_at DESC);
