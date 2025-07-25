package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func (app *application) serve() error {
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", app.config.port),
		Handler:      app.routes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	shutdownError := make(chan error)

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		s := <-quit

		app.logger.Info(context.Background(), "shutting down server",
			"signal", s.String(),
			"addr", srv.Addr,
		)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		
		err := srv.Shutdown(ctx)
		if err != nil {
			shutdownError <- err
		}
		
		app.logger.Info(context.Background(), "completing background tasks",
			"addr", srv.Addr,
		)
		
		app.wg.Wait()
		shutdownError <- nil
	}()

	app.logger.Info(context.Background(), "TECHNOPRISE server starting",
		"addr", srv.Addr,
		"env", app.config.env,
		"version", version,
	)

	err := srv.ListenAndServe()
	if !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	
	err = <-shutdownError
	if err != nil {
		return err
	}
	
	app.logger.Info(context.Background(), "server stopped gracefully",
		"addr", srv.Addr,
	)
	return nil
}
