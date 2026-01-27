package logger

import (
	"os"

	"github.com/inconshreveable/log15"
)

var Log log15.Logger

func init() {
	Log = log15.New()
	handler := log15.StreamHandler(os.Stderr, log15.TerminalFormat())
	Log.SetHandler(handler)
}

// SetLevel sets the logging level.
func SetLevel(level string) {
	lvl, err := log15.LvlFromString(level)
	if err != nil {
		Log.Warn("Unknown log level, defaulting to info", "level", level)
		lvl = log15.LvlInfo
	}
	Log.SetHandler(log15.LvlFilterHandler(lvl, Log.GetHandler()))
}
