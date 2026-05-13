package model

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"unicode/utf8"
)

type SettingKey string

const (
	SettingKeyProxyURL                   SettingKey = "proxy_url"
	SettingKeySiteTitle                  SettingKey = "site_title"
	SettingKeySiteLogoDataURL            SettingKey = "site_logo_data_url"
	SettingKeyStatsSaveInterval          SettingKey = "stats_save_interval"
	SettingKeyModelInfoUpdateInterval    SettingKey = "model_info_update_interval"
	SettingKeySyncLLMInterval            SettingKey = "sync_llm_interval"
	SettingKeySiteSyncInterval           SettingKey = "site_sync_interval"
	SettingKeySiteCheckinInterval        SettingKey = "site_checkin_interval"
	SettingKeyRelayLogKeepPeriod         SettingKey = "relay_log_keep_period"
	SettingKeyRelayLogKeepEnabled        SettingKey = "relay_log_keep_enabled"
	SettingKeyCORSAllowOrigins           SettingKey = "cors_allow_origins"
	SettingKeyCircuitBreakerThreshold    SettingKey = "circuit_breaker_threshold"
	SettingKeyCircuitBreakerCooldown     SettingKey = "circuit_breaker_cooldown"
	SettingKeyCircuitBreakerMaxCooldown  SettingKey = "circuit_breaker_max_cooldown"
	SettingKeyRelayWSUpgradeEnabled      SettingKey = "relay_ws_upgrade_enabled"
	SettingKeySSEHeartbeatInterval       SettingKey = "sse_heartbeat_interval"
	SettingKeySSEPreStreamHeartbeatDelay SettingKey = "sse_pre_stream_heartbeat_delay"
	SettingKeyJWTSecret                  SettingKey = "jwt_secret"
	SettingKeyStatsSiteModelBackfilled   SettingKey = "stats_site_model_backfilled"
)

type Setting struct {
	Key   SettingKey `json:"key" gorm:"primaryKey"`
	Value string     `json:"value" gorm:"not null"`
}

func DefaultSettings() []Setting {
	return []Setting{
		{Key: SettingKeyProxyURL, Value: ""},
		{Key: SettingKeySiteTitle, Value: "Octopus"},
		{Key: SettingKeySiteLogoDataURL, Value: ""},
		{Key: SettingKeyStatsSaveInterval, Value: "10"},
		{Key: SettingKeyCORSAllowOrigins, Value: ""},
		{Key: SettingKeyModelInfoUpdateInterval, Value: "24"},
		{Key: SettingKeySyncLLMInterval, Value: "24"},
		{Key: SettingKeySiteSyncInterval, Value: "12"},
		{Key: SettingKeySiteCheckinInterval, Value: "24"},
		{Key: SettingKeyRelayLogKeepPeriod, Value: "7"},
		{Key: SettingKeyRelayLogKeepEnabled, Value: "true"},
		{Key: SettingKeyCircuitBreakerThreshold, Value: "5"},
		{Key: SettingKeyCircuitBreakerCooldown, Value: "60"},
		{Key: SettingKeyCircuitBreakerMaxCooldown, Value: "600"},
		{Key: SettingKeyRelayWSUpgradeEnabled, Value: "false"},
		{Key: SettingKeySSEHeartbeatInterval, Value: "0"},
		{Key: SettingKeySSEPreStreamHeartbeatDelay, Value: "0"},
		{Key: SettingKeyJWTSecret, Value: ""},
		{Key: SettingKeyStatsSiteModelBackfilled, Value: "false"},
	}
}

func (s *Setting) Validate() error {
	switch s.Key {
	case SettingKeyModelInfoUpdateInterval, SettingKeySyncLLMInterval, SettingKeySiteSyncInterval,
		SettingKeySiteCheckinInterval, SettingKeyRelayLogKeepPeriod,
		SettingKeyCircuitBreakerThreshold, SettingKeyCircuitBreakerCooldown, SettingKeyCircuitBreakerMaxCooldown:
		_, err := strconv.Atoi(s.Value)
		if err != nil {
			return fmt.Errorf("setting value must be an integer")
		}
		return nil
	case SettingKeySSEHeartbeatInterval, SettingKeySSEPreStreamHeartbeatDelay:
		value, err := strconv.Atoi(s.Value)
		if err != nil {
			return fmt.Errorf("setting value must be an integer")
		}
		if value < 0 {
			return fmt.Errorf("setting value must be non-negative")
		}
		return nil
	case SettingKeyRelayLogKeepEnabled, SettingKeyRelayWSUpgradeEnabled:
		if s.Value != "true" && s.Value != "false" {
			return fmt.Errorf("relay log keep enabled must be true or false")
		}
		return nil
	case SettingKeyProxyURL:
		if s.Value == "" {
			return nil
		}
		parsedURL, err := url.Parse(s.Value)
		if err != nil {
			return fmt.Errorf("proxy URL is invalid: %w", err)
		}
		validSchemes := map[string]bool{
			"http":   true,
			"https":  true,
			"socks5": true,
		}
		if !validSchemes[parsedURL.Scheme] {
			return fmt.Errorf("proxy URL scheme must be http, https, socks, or socks5")
		}
		if parsedURL.Host == "" {
			return fmt.Errorf("proxy URL must have a host")
		}
		return nil
	case SettingKeySiteTitle:
		s.Value = strings.TrimSpace(s.Value)
		if utf8.RuneCountInString(s.Value) > 64 {
			return fmt.Errorf("site title must be 64 characters or fewer")
		}
		return nil
	case SettingKeySiteLogoDataURL:
		s.Value = strings.TrimSpace(s.Value)
		if s.Value == "" {
			return nil
		}
		if !strings.HasPrefix(s.Value, "data:image/") {
			return fmt.Errorf("site logo must be an image data URL")
		}
		if !strings.Contains(s.Value, ";base64,") {
			return fmt.Errorf("site logo must be a base64 image data URL")
		}
		if len(s.Value) > 2*1024*1024 {
			return fmt.Errorf("site logo is too large")
		}
		return nil
	}

	return nil
}
