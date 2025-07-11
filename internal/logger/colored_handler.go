package logger

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"strings"
)

// coloredJSONHandler is a custom slog handler that adds color to JSON output
type coloredJSONHandler struct {
	slog.Handler
	writer io.Writer
}

// newColoredJSONHandler creates a new colored JSON handler
func newColoredJSONHandler(w io.Writer, opts *slog.HandlerOptions) *coloredJSONHandler {
	return &coloredJSONHandler{
		Handler: slog.NewJSONHandler(w, opts),
		writer:  w,
	}
}

// Handle processes the log record and adds color formatting
func (h *coloredJSONHandler) Handle(ctx context.Context, r slog.Record) error {
	// Create a buffer to capture the JSON output
	var buf bytes.Buffer
	
	// Create a temporary JSON handler to format the record
	tempHandler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{
		AddSource: true,
		Level:     slog.LevelDebug,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == slog.SourceKey {
				if source, ok := a.Value.Any().(*slog.Source); ok {
					v := fmt.Sprintf("%s:%d", strings.TrimPrefix(source.File, "/"), source.Line)
					// Extract just the filename from the full path
					parts := strings.Split(v, "/")
					if len(parts) > 0 {
						v = parts[len(parts)-1]
					}
					return slog.Attr{Key: "file", Value: slog.StringValue(v)}
				}
			}
			return a
		},
	})
	
	// Handle the record with the temporary handler
	if err := tempHandler.Handle(ctx, r); err != nil {
		return err
	}
	
	// Get the JSON string and parse it to add colors
	jsonStr := buf.String()
	
	// Parse the JSON to extract the level
	var logData map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &logData); err != nil {
		// If we can't parse JSON, just write it as-is
		h.writer.Write([]byte(jsonStr))
		return nil
	}
	
	// Apply color based on level
	var coloredJSON string
	if level, ok := logData["level"].(string); ok {
		switch level {
		case "INFO":
			coloredJSON = colorInfo.Sprint(jsonStr)
		case "WARN":
			coloredJSON = colorWarn.Sprint(jsonStr)
		case "ERROR":
			coloredJSON = colorError.Sprint(jsonStr)
		case "DEBUG":
			coloredJSON = colorDebug.Sprint(jsonStr)
		default:
			coloredJSON = jsonStr
		}
	} else {
		coloredJSON = jsonStr
	}
	
	// Write the colored JSON to the writer
	_, err := h.writer.Write([]byte(coloredJSON))
	return err
}

// WithAttrs returns a new handler with the given attributes
func (h *coloredJSONHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &coloredJSONHandler{
		Handler: h.Handler.WithAttrs(attrs),
		writer:  h.writer,
	}
}

// WithGroup returns a new handler with the given group
func (h *coloredJSONHandler) WithGroup(name string) slog.Handler {
	return &coloredJSONHandler{
		Handler: h.Handler.WithGroup(name),
		writer:  h.writer,
	}
}