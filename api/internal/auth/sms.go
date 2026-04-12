package auth

import (
	"context"
	"fmt"

	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"

	twilio "github.com/twilio/twilio-go"
)

// SMSProvider sends SMS messages.
type SMSProvider interface {
	Send(ctx context.Context, to, body string) error
}

// TwilioSMSProvider sends SMS via Twilio.
type TwilioSMSProvider struct {
	client     *twilio.RestClient
	fromNumber string
}

func NewTwilioSMSProvider(accountSID, authToken, fromNumber string) *TwilioSMSProvider {
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: accountSID,
		Password: authToken,
	})
	return &TwilioSMSProvider{
		client:     client,
		fromNumber: fromNumber,
	}
}

func (p *TwilioSMSProvider) Send(_ context.Context, to, body string) error {
	params := &twilioApi.CreateMessageParams{}
	params.SetTo(to)
	params.SetFrom(p.fromNumber)
	params.SetBody(body)

	_, err := p.client.Api.CreateMessage(params)
	if err != nil {
		return fmt.Errorf("twilio send sms: %w", err)
	}
	return nil
}
