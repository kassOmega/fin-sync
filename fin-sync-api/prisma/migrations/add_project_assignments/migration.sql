-- Create ProjectAssignment table to link users to projects
CREATE TABLE IF NOT EXISTS finsync."ProjectAssignment" (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES finsync."Project"(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES finsync."User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "ProjectAssignment_projectId_userId_key" UNIQUE ("project_id", "user_id")
);

-- Add relation from User to ProjectAssignment
-- (Prisma schema addition: User.projectAssignments -> ProjectAssignment[])