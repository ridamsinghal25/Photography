-- Create AppUsers table
CREATE TABLE AppUsers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    clerkId NVARCHAR(255) NOT NULL UNIQUE,
    email NVARCHAR(255) NOT NULL UNIQUE,
    name NVARCHAR(255) NOT NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

-- Create Categories table
CREATE TABLE Categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL UNIQUE,

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);



-- Create Tags table
CREATE TABLE Tags (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL UNIQUE,

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);


-- Create Subjects table
CREATE TABLE Subjects (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    name NVARCHAR(255) NOT NULL,

    instaHandle NVARCHAR(255),
    email NVARCHAR(255),
    phone_number NVARCHAR(50),
    city NVARCHAR(255),
    country NVARCHAR(255),
    portfolio_url NVARCHAR(1000),

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CK_Subjects_InstaHandle
        CHECK (
            instaHandle IS NULL
            OR (
                instaHandle LIKE '@_%'
                AND instaHandle NOT LIKE '% %'
            )
        ),

    CONSTRAINT CK_Subjects_Email
        CHECK (
            email IS NULL
            OR email LIKE '_%@_%._%'
        )
);

-- Create Photos table
CREATE TABLE PhotoDetails (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    userId UNIQUEIDENTIFIER NOT NULL,

    categoryId UNIQUEIDENTIFIER NOT NULL,
    subjectId UNIQUEIDENTIFIER NULL,

    slug NVARCHAR(255) NOT NULL,

    cameraBody NVARCHAR(255),
    lens NVARCHAR(255),

    place NVARCHAR(255),
    city NVARCHAR(255),

    capturedDate DATE,
    capturedTime TIME,

    caption NVARCHAR(MAX),
    aiGeneratedText NVARCHAR(MAX),

    aperture NVARCHAR(30),
    iso NVARCHAR(30),
    shutterSpeed NVARCHAR(30),

    storedFileName NVARCHAR(255) NOT NULL,

    originalUrl NVARCHAR(1000) NOT NULL,
    compressedUrl NVARCHAR(1000),

    fileSize BIGINT,
    mimeType NVARCHAR(100),

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_PhotoDetails_User
        FOREIGN KEY (userId)
        REFERENCES AppUsers(id),

    CONSTRAINT FK_PhotoDetails_Category
        FOREIGN KEY (categoryId)
        REFERENCES Categories(id),

    CONSTRAINT FK_PhotoDetails_Subject
        FOREIGN KEY (subjectId)
        REFERENCES Subjects(id),

    CONSTRAINT UQ_PhotoDetails_User_Slug
        UNIQUE (userId, slug)
);


-- Create PhotoTags table
CREATE TABLE PhotoTags (
    photoId UNIQUEIDENTIFIER NOT NULL,
    tagId UNIQUEIDENTIFIER NOT NULL,

    PRIMARY KEY (photoId, tagId),

    CONSTRAINT FK_PhotoTags_Photo
        FOREIGN KEY (photoId)
        REFERENCES PhotoDetails(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_PhotoTags_Tag
        FOREIGN KEY (tagId)
        REFERENCES Tags(id)
);


-- Indexes
CREATE INDEX IX_PhotoDetails_UserId
ON PhotoDetails(userId);

CREATE INDEX IX_PhotoDetails_CategoryId
ON PhotoDetails(categoryId);

CREATE INDEX IX_PhotoTags_TagId
ON PhotoTags(tagId);

-- Also thinking for these
CREATE INDEX IX_PhotoDetails_User_Date
ON PhotoDetails(userId, capturedDate DESC);

CREATE INDEX IX_PhotoDetails_Category_Date
ON PhotoDetails(categoryId, capturedDate DESC);

-- mimeType NVARCHAR(100) NOT NULL, to be required filed
-- categoryId to be optional field