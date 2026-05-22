-- CreateTable
CREATE TABLE "Waypoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "posX" REAL NOT NULL,
    "posY" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Edge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "label" TEXT
);

-- CreateTable
CREATE TABLE "Tour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TourWaypoint" (
    "tourId" TEXT NOT NULL,
    "waypointId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    PRIMARY KEY ("tourId", "order"),
    CONSTRAINT "TourWaypoint_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TourWaypoint_tourId_idx" ON "TourWaypoint"("tourId");
