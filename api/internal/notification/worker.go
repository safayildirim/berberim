package notification

import (
	"context"
	"time"

	"go.uber.org/zap"
)

type Worker struct {
	log       *zap.Logger
	svc       *Service
	interval  time.Duration
	batchSize int
}

func NewWorker(log *zap.Logger, svc *Service, interval time.Duration, batchSize int) *Worker {
	if interval <= 0 {
		interval = 20 * time.Second
	}
	if batchSize <= 0 {
		batchSize = 100
	}
	return &Worker{
		log:       log,
		svc:       svc,
		interval:  interval,
		batchSize: batchSize,
	}
}

func (w *Worker) Run(ctx context.Context) error {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()

	for {
		if err := w.runOnce(ctx); err != nil {
			w.log.Warn("notification worker iteration failed", zap.Error(err))
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func (w *Worker) runOnce(ctx context.Context) error {
	stats, err := w.svc.DispatchDueReminders(ctx, w.batchSize)
	if err != nil {
		return err
	}
	if stats.Claimed > 0 {
		w.log.Info("notification reminders dispatched",
			zap.Int("claimed", stats.Claimed),
			zap.Int("sent", stats.Sent),
			zap.Int("failed", stats.Failed),
			zap.Int("skipped", stats.Skipped),
		)
	}
	return nil
}
