package apierr

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ErrorResponse is the canonical error envelope for all API responses.
type ErrorResponse struct {
	Error   string       `json:"error"`
	Message string       `json:"message"`
	Details []FieldError `json:"details,omitempty"`
}

// FieldError describes a single field-level validation failure.
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// New builds an ErrorResponse without field details.
func New(code, message string) ErrorResponse {
	return ErrorResponse{Error: code, Message: message}
}

// WithDetails builds an ErrorResponse with field-level details.
func WithDetails(code, message string, details []FieldError) ErrorResponse {
	return ErrorResponse{Error: code, Message: message, Details: details}
}

// Write writes the error response as JSON with the given HTTP status code.
func Write(c *echo.Context, httpStatus int, resp ErrorResponse) error {
	return c.JSON(httpStatus, resp)
}

// GRPC maps a gRPC error to the appropriate HTTP status and ErrorResponse.
func GRPC(c *echo.Context, err error) error {
	st, _ := status.FromError(err)
	return Write(c, grpcToHTTP(st.Code()), New(grpcToCode(st.Code()), st.Message()))
}

func grpcToHTTP(code codes.Code) int {
	switch code {
	case codes.OK:
		return http.StatusOK
	case codes.InvalidArgument, codes.FailedPrecondition:
		return http.StatusBadRequest
	case codes.NotFound:
		return http.StatusNotFound
	case codes.AlreadyExists:
		return http.StatusConflict
	case codes.PermissionDenied:
		return http.StatusForbidden
	case codes.Unauthenticated:
		return http.StatusUnauthorized
	case codes.ResourceExhausted:
		return http.StatusTooManyRequests
	case codes.Unimplemented:
		return http.StatusNotImplemented
	default:
		return http.StatusInternalServerError
	}
}

func grpcToCode(code codes.Code) string {
	switch code {
	case codes.InvalidArgument:
		return "invalid_argument"
	case codes.NotFound:
		return "not_found"
	case codes.AlreadyExists:
		return "already_exists"
	case codes.PermissionDenied:
		return "permission_denied"
	case codes.Unauthenticated:
		return "unauthenticated"
	case codes.ResourceExhausted:
		return "rate_limited"
	case codes.FailedPrecondition:
		return "failed_precondition"
	case codes.Unimplemented:
		return "not_implemented"
	default:
		return "internal_error"
	}
}
