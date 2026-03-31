// Универсальный player для step timeline
// Поддерживает:
// - next / prev / reset
// - play / pause / toggle
// - подписку на изменения состояния



export function createPlayer({ steps = [], delay = 700 } = {}) {
  let stepIndex = 0;
  let timer = null;
  let onChange = () => {};

  function hasSteps() {
    return steps.length > 0;
  }

  function getCurrentStep() {
    return hasSteps() ? steps[stepIndex] : null;
  }

  function getState() {
    return {
      stepIndex,
      step: getCurrentStep(),
      totalSteps: steps.length,
      isPlaying: Boolean(timer),
      isFirst: stepIndex === 0,
      isLast: !hasSteps() || stepIndex === steps.length - 1
    };
  }

  function emit() {
    onChange(getState());
  }

  function stopTimer() {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  }

  function next() {
    if (!hasSteps()) {
      emit();
      return;
    }

    if (stepIndex < steps.length - 1) {
      stepIndex += 1;
      emit();
      return;
    }

    pause();
  }

  function prev() {
    if (!hasSteps()) {
      emit();
      return;
    }

    if (stepIndex > 0) {
      stepIndex -= 1;
    }

    emit();
  }

  function reset() {
    stopTimer();
    stepIndex = 0;
    emit();
  }

  function play() {
    if (!hasSteps() || timer) {
      emit();
      return;
    }

    if (stepIndex >= steps.length - 1) {
      stepIndex = 0;
    }

    timer = setInterval(() => {
      if (stepIndex >= steps.length - 1) {
        stopTimer();
        emit();
        return;
      }

      stepIndex += 1;
      emit();
    }, delay);

    emit();
  }

  function pause() {
    const wasPlaying = Boolean(timer);
    stopTimer();

    if (wasPlaying) {
      emit();
    }
  }

  function toggle() {
    if (timer) {
      pause();
    } else {
      play();
    }
  }

  function subscribe(callback) {
    onChange = typeof callback === "function" ? callback : () => {};
    emit();

    return () => {
      onChange = () => {};
    };
  }

  function destroy() {
    stopTimer();
    onChange = () => {};
  }

  return {
    subscribe,
    getState,
    getCurrentStep,
    next,
    prev,
    reset,
    play,
    pause,
    toggle,
    destroy
  };
}