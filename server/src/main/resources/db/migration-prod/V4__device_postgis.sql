-- V4: devices geography 컬럼 (PostgreSQL 전용). lat/lng nullable → null 가드.

ALTER TABLE devices ADD COLUMN location geography(POINT, 4326);

UPDATE devices
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location IS NULL;

CREATE INDEX idx_device_location_geo ON devices USING GIST (location);

CREATE OR REPLACE FUNCTION sync_device_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    ELSE
        NEW.location := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_device_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON devices
    FOR EACH ROW
    EXECUTE FUNCTION sync_device_location();
