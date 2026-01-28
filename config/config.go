package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type Config struct {
	ProviderKeys map[string]string `json:"provider_keys"`
	ActiveModel  string            `json:"active_model"`
}

func NewConfig(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
	}

	c := &Config{
		ProviderKeys: make(map[string]string),
		ActiveModel:  "",
	}
	if err := json.Unmarshal(data, c); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Ensure map is not nil after loading
	if c.ProviderKeys == nil {
		c.ProviderKeys = make(map[string]string)
	}

	return c, nil
}

func (c *Config) LoadFromEnv() {
	if key := os.Getenv("GOOGLE_API_KEY"); key != "" {
		c.SetProviderKey("google", key)
	} else if key := os.Getenv("GEMINI_API_KEY"); key != "" {
		c.SetProviderKey("google", key)
	}

	if key := os.Getenv("OPENAI_API_KEY"); key != "" {
		c.SetProviderKey("openai", key)
	}

	if model := os.Getenv("ACTIVE_MODEL"); model != "" {
		c.SetActiveModel(model)
	}
}

func (c *Config) SetProviderKey(provider, key string) {
	if c.ProviderKeys == nil {
		c.ProviderKeys = make(map[string]string)
	}
	c.ProviderKeys[provider] = key
}

func (c *Config) GetProviderKey(provider string) string {
	if c.ProviderKeys == nil {
		return ""
	}
	return c.ProviderKeys[provider]
}

func (c *Config) SetActiveModel(model string) {
	c.ActiveModel = model
}

func (c *Config) GetActiveModel() string {
	return c.ActiveModel
}

// Save persists the configuration to the specified file path in JSON format.
func (c *Config) Save(path string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// DefaultConfigPath returns the default path for the configuration file.
// Usually ~/.luccibot/config.json
func DefaultConfigPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %w", err)
	}
	return filepath.Join(home, ".luccibot", "config.json"), nil
}
