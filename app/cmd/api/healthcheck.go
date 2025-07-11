package main

import (
	"net/http"
)

// Declare a handler which writes a plain-text response with information about the // application status, operating environment and version.
func (app *application) healthcheckHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	app.logger.Info(ctx, "health check requested",
		"remote_addr", r.RemoteAddr,
		"user_agent", r.UserAgent(),
	)
	
	env := envelope{
		"status": "available",
		"system_info": map[string]string{
			"environment": app.config.env,
			"version":     version,
		},
	}

	err := app.writeJSON(w, http.StatusOK, env, nil)
	if err != nil {
		app.serverErrorResponse(w, r, err)
	}
}
