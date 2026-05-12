package relay

import (
	"encoding/json"
	"testing"

	dbmodel "github.com/bestruirui/octopus/internal/model"
	transformerModel "github.com/bestruirui/octopus/internal/transformer/model"
)

func TestApplyChannelRequestOverridesForcesResponsesStream(t *testing.T) {
	stream := false
	attempt := &relayAttempt{
		relayRequest: &relayRequest{
			internalRequest: &transformerModel.InternalLLMRequest{
				Stream:       &stream,
				RawAPIFormat: transformerModel.APIFormatOpenAIResponse,
			},
			rawBody: []byte(`{"model":"gpt-5.4","input":"hello","stream":false}`),
		},
		channel: &dbmodel.Channel{ForceStream: true},
	}

	restore, err := attempt.applyChannelRequestOverrides()
	if err != nil {
		t.Fatalf("applyChannelRequestOverrides() error = %v", err)
	}
	defer restore()

	if attempt.internalRequest.Stream == nil || !*attempt.internalRequest.Stream {
		t.Fatalf("expected internal request stream to be forced true")
	}

	var payload map[string]any
	if err := json.Unmarshal(attempt.rawBody, &payload); err != nil {
		t.Fatalf("unmarshal rewritten raw body failed: %v", err)
	}
	if got, ok := payload["stream"].(bool); !ok || !got {
		t.Fatalf("expected rewritten raw body stream=true, got %#v", payload["stream"])
	}

	restore()
	if attempt.internalRequest.Stream == nil || *attempt.internalRequest.Stream {
		t.Fatalf("expected restore to bring stream back to false")
	}
}
