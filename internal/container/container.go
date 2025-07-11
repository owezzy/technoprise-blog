package container

import (
	"io"
	"os"

	"blog/internal/data"
	"blog/internal/logger"
)

// Container holds all application dependencies.
type Container struct {
	Logger   *logger.LoggerDependencies
	Database *data.Models
}

// Config holds configuration for dependency initialization.
type Config struct {
	ServiceName    string
	LogLevel       logger.Level
	LogOutput      io.Writer
	NoColor        bool
	DatabaseModels *data.Models
}

// NewContainer creates a new dependency injection container.
func NewContainer(cfg Config) (*Container, error) {
	// Set defaults
	if cfg.LogOutput == nil {
		cfg.LogOutput = os.Stdout
	}
	if cfg.ServiceName == "" {
		cfg.ServiceName = "technoprise-api"
	}
	if cfg.LogLevel == 0 {
		cfg.LogLevel = logger.LevelInfo
	}

	// Initialize structured logger
	structLogger := logger.NewWithNoColor(
		cfg.LogOutput,
		cfg.LogLevel,
		cfg.ServiceName,
		nil, // No trace ID function for now
		cfg.NoColor,
	)

	// Initialize context logger
	contextLogger := logger.NewContextLogger(structLogger)

	// Initialize HTTP logger
	httpLogger := logger.NewHTTPLogger(contextLogger)

	// Initialize API metrics
	apiMetrics := logger.NewAPIMetrics(contextLogger)

	// Create logger dependencies
	loggerDeps := logger.NewLoggerDependencies(
		structLogger,
		contextLogger,
		httpLogger,
		apiMetrics,
	)

	return &Container{
		Logger:   loggerDeps,
		Database: cfg.DatabaseModels,
	}, nil
}

// GetStructLogger returns the structured logger.
func (c *Container) GetStructLogger() logger.ILogger {
	return c.Logger.StructLogger
}

// GetContextLogger returns the context-aware logger.
func (c *Container) GetContextLogger() logger.IContextLogger {
	return c.Logger.ContextLogger
}

// GetHTTPLogger returns the HTTP logger.
func (c *Container) GetHTTPLogger() logger.IHTTPLogger {
	return c.Logger.HTTPLogger
}

// GetAPIMetrics returns the API metrics collector.
func (c *Container) GetAPIMetrics() logger.IAPIMetrics {
	return c.Logger.APIMetrics
}

// GetDatabase returns the database models.
func (c *Container) GetDatabase() *data.Models {
	return c.Database
}
