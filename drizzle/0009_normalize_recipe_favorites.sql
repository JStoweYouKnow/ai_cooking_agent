-- Normalize recipe favorites to booleans
-- Treat "true"/"1"/1 as true, everything else as false
UPDATE recipes
SET isFavorite = TRUE
WHERE CAST(isFavorite AS CHAR) IN ('1', 'true', 'TRUE');

UPDATE recipes
SET isFavorite = FALSE
WHERE isFavorite IS NULL OR CAST(isFavorite AS CHAR) NOT IN ('1', 'true', 'TRUE');
