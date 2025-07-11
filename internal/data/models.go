package data

import (
	"database/sql"
	"errors"
)

var (
	ErrRecordNotFound = errors.New("record not found")
	ErrEditConflict   = errors.New("edit conflict")
)

// Create a Models struct which wraps the data models for our application.
type Models struct {
	Posts       PostModel
	Images      ImageModel
	Permissions PermissionModel
	Tokens      TokenModel
	Users       UserModel
}

// For ease of use, we also add a New() method which returns a Models struct containing
// the initialized data models.
func NewModels(db *sql.DB) Models {
	return Models{
		Posts:       PostModel{DB: db},
		Images:      ImageModel{DB: db},
		Permissions: PermissionModel{DB: db},
		Tokens:      TokenModel{DB: db},
		Users:       UserModel{DB: db},
	}
}
