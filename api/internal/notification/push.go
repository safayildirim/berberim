package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

var ErrInvalidPushToken = errors.New("invalid push token")

type PushMessage struct {
	Title string
	Body  string
	Data  map[string]interface{}
}

type PushProvider interface {
	ProviderName() string
	Send(ctx context.Context, token string, msg PushMessage) error
}

type ExpoPushProvider struct {
	client *http.Client
}

func NewExpoPushProvider() *ExpoPushProvider {
	return &ExpoPushProvider{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (p *ExpoPushProvider) ProviderName() string { return "expo" }

func (p *ExpoPushProvider) Send(ctx context.Context, token string, msg PushMessage) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return fmt.Errorf("%w: empty token", ErrInvalidPushToken)
	}
	if !strings.HasPrefix(token, "ExponentPushToken[") && !strings.HasPrefix(token, "ExpoPushToken[") {
		return fmt.Errorf("%w: unsupported expo token format", ErrInvalidPushToken)
	}

	reqBody := map[string]interface{}{
		"to":    token,
		"title": msg.Title,
		"body":  msg.Body,
		"data":  msg.Data,
		"sound": "default",
	}
	b, _ := json.Marshal(reqBody)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://exp.host/--/api/v2/push/send", bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var decoded struct {
		Data struct {
			Status  string `json:"status"`
			Message string `json:"message"`
			Details struct {
				Error string `json:"error"`
			} `json:"details"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&decoded); err != nil {
		return fmt.Errorf("decode expo push response: %w", err)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("expo push http status %d", resp.StatusCode)
	}
	if decoded.Data.Status != "ok" {
		if decoded.Data.Details.Error == "DeviceNotRegistered" {
			return fmt.Errorf("%w: %s", ErrInvalidPushToken, decoded.Data.Message)
		}
		return fmt.Errorf("expo push rejected: %s", decoded.Data.Message)
	}
	return nil
}
