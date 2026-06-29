-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Waypoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "filePath" TEXT,
    "posX" REAL NOT NULL,
    "posY" REAL NOT NULL
);
INSERT INTO "new_Waypoint" SELECT "id", "label", "type", "description", "notes", "filePath", "posX", "posY" FROM "Waypoint";
DROP TABLE "Waypoint";
ALTER TABLE "new_Waypoint" RENAME TO "Waypoint";
PRAGMA foreign_keys=ON;
