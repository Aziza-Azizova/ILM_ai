import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Chip, Alert,
  LinearProgress, Radio, RadioGroup, FormControlLabel,
  TextField, Divider, Stack, Avatar, Tooltip,
} from '@mui/material';
import {
  Quiz as QuizIcon, CheckCircle, Cancel, EmojiEvents,
  Refresh, History as HistoryIcon, ArrowForward,
} from '@mui/icons-material';
import { quizApi } from '../../api/quiz.api';
import type { QuizSession, QuizQuestion, AnswerFeedback, QuizDifficulty } from '../../api/quiz.api';
import { topicsApi } from '../../api/topics.api';
import type { Topic } from '../../api/topics.api';

type Step = 'setup' | 'generating' | 'question' | 'results';

const DIFFICULTY_META: Record<QuizDifficulty, { label: string; color: 'success' | 'warning' | 'error'; desc: string }> = {
  gentle: { label: 'Gentle', color: 'success', desc: 'Basic recall & comprehension' },
  solid:  { label: 'Solid',  color: 'warning', desc: 'Application & analysis' },
  expert: { label: 'Expert', color: 'error',   desc: 'Synthesis & edge cases' },
};

export default function QuizPage() {
  const [step, setStep] = useState<Step>('setup');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('gentle');
  const [questionCount, setQuestionCount] = useState(5);
  const [session, setSession] = useState<(QuizSession & { questions: QuizQuestion[] }) | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [openText, setOpenText] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<QuizSession[]>([]);
  const [historyTab, setHistoryTab] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    topicsApi.getAll().then(setTopics).catch(() => {});
    quizApi.getHistory().then(setHistory).catch(() => {});
  }, []);

  const currentQuestion: QuizQuestion | undefined = session?.questions[currentIdx];
  const isLastQuestion = session ? currentIdx === session.questions.length - 1 : false;
  const progress = session ? Math.round((currentIdx / session.questions.length) * 100) : 0;
  const userAnswer = currentQuestion?.type === 'multiple_choice' ? selectedOption : openText;

  // ── Start quiz ──────────────────────────────────────────────────────────────

  const handleStart = async () => {
    setError('');
    setStep('generating');
    try {
      const result = await quizApi.start({
        topicId: topicId || undefined,
        difficulty,
        questionCount,
      });
      setSession(result);
      setCurrentIdx(0);
      setFeedback(null);
      setSelectedOption('');
      setOpenText('');
      setStep('question');
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
        'Failed to generate quiz. Make sure you have uploaded and processed documents.',
      );
      setStep('setup');
    }
  };

  // ── Submit answer ───────────────────────────────────────────────────────────

  const handleSubmitAnswer = async () => {
    if (!session || !currentQuestion) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await quizApi.submitAnswer(session.id, currentQuestion.id, userAnswer);
      setFeedback(result);
      setSession(prev => {
        if (!prev) return prev;
        const updated = prev.questions.map((q, i) =>
          i === currentIdx
            ? { ...q, userAnswer, isCorrect: result.isCorrect, correctAnswer: result.correctAnswer, explanation: result.explanation }
            : q,
        );
        return { ...prev, questions: updated };
      });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Next / Finish ───────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!session) return;
    if (isLastQuestion) {
      try {
        const finished = await quizApi.finish(session.id);
        setSession(prev =>
          prev ? { ...prev, score: finished.score, correctAnswers: finished.correctAnswers } : prev,
        );
        quizApi.getHistory().then(setHistory).catch(() => {});
      } catch { /* score is computed locally anyway */ }
      setStep('results');
    } else {
      setCurrentIdx(i => i + 1);
      setFeedback(null);
      setSelectedOption('');
      setOpenText('');
    }
  };

  const handleRestart = () => {
    setStep('setup');
    setSession(null);
    setFeedback(null);
    setSelectedOption('');
    setOpenText('');
    setCurrentIdx(0);
    setError('');
  };

  // ── History tab ─────────────────────────────────────────────────────────────

  if (historyTab) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto', width: '100%' }}>
        <Button startIcon={<QuizIcon />} onClick={() => setHistoryTab(false)} sx={{ mb: 3 }}>
          Back to Quiz
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Quiz History</Typography>
        {history.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No quizzes taken yet.</Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {history.map(s => (
              <Card key={s.id}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    bgcolor: s.score >= 80 ? 'success.main' : s.score >= 50 ? 'warning.main' : 'error.main',
                    fontWeight: 700,
                  }}>
                    {s.score}%
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {DIFFICULTY_META[s.difficulty].label} · {s.totalQuestions} questions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.correctAnswers}/{s.totalQuestions} correct ·{' '}
                      {new Date(s.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                  <Chip
                    label={DIFFICULTY_META[s.difficulty].label}
                    color={DIFFICULTY_META[s.difficulty].color}
                    size="small"
                  />
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    );
  }

  // ── Setup ───────────────────────────────────────────────────────────────────

  if (step === 'setup') {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 640, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Quiz & Practice</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Test your knowledge on your uploaded materials
            </Typography>
          </Box>
          <Tooltip title="View history">
            <Button startIcon={<HistoryIcon />} onClick={() => setHistoryTab(true)} variant="outlined" size="small">
              History
            </Button>
          </Tooltip>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Quiz settings</Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Topic (optional)</InputLabel>
              <Select
                value={topicId}
                label="Topic (optional)"
                onChange={e => setTopicId(e.target.value as string)}
              >
                <MenuItem value=""><em>All topics</em></MenuItem>
                {topics.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Difficulty</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              {(Object.keys(DIFFICULTY_META) as QuizDifficulty[]).map(d => (
                <Card
                  key={d}
                  onClick={() => setDifficulty(d)}
                  sx={{
                    flex: 1, cursor: 'pointer', border: 2,
                    borderColor: difficulty === d ? 'primary.main' : 'divider',
                    transition: 'border-color 0.15s',
                    '&:hover': { borderColor: 'primary.light' },
                  }}
                >
                  <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
                    <Chip
                      label={DIFFICULTY_META[d].label}
                      color={DIFFICULTY_META[d].color}
                      size="small"
                      sx={{ mb: 0.5, pointerEvents: 'none' }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      {DIFFICULTY_META[d].desc}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>

            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Number of questions</Typography>
            <Stack direction="row" spacing={1}>
              {[3, 5, 10, 15].map(n => (
                <Button
                  key={n}
                  variant={questionCount === n ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setQuestionCount(n)}
                  sx={{ minWidth: 52 }}
                >
                  {n}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Button
          variant="contained" size="large" fullWidth
          startIcon={<QuizIcon />}
          onClick={handleStart}
        >
          Start Quiz
        </Button>
      </Box>
    );
  }

  // ── Generating ──────────────────────────────────────────────────────────────

  if (step === 'generating') {
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: 3,
      }}>
        <CircularProgress size={56} />
        <Typography variant="h6" color="text.secondary">Generating your quiz…</Typography>
        <Typography color="text.disabled">Claude is reading your materials and crafting questions</Typography>
      </Box>
    );
  }

  // ── Question ────────────────────────────────────────────────────────────────

  if (step === 'question' && session && currentQuestion) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 720, mx: 'auto', width: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Question {currentIdx + 1} of {session.questions.length}
            </Typography>
            <Chip
              label={DIFFICULTY_META[session.difficulty].label}
              color={DIFFICULTY_META[session.difficulty].color}
              size="small"
            />
          </Box>
          <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2, height: 6 }} />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, lineHeight: 1.6 }}>
              {currentQuestion.question}
            </Typography>

            {currentQuestion.type === 'multiple_choice' && (
              <RadioGroup
                value={selectedOption}
                onChange={e => { if (!feedback) setSelectedOption(e.target.value); }}
              >
                {currentQuestion.options?.map((opt, i) => {
                  let borderColor = 'divider';
                  let bgcolor = 'transparent';
                  if (feedback) {
                    if (opt === feedback.correctAnswer) { borderColor = 'success.main'; bgcolor = 'success.50'; }
                    else if (opt === selectedOption && !feedback.isCorrect) { borderColor = 'error.main'; bgcolor = 'error.50'; }
                  }
                  return (
                    <FormControlLabel
                      key={i}
                      value={opt}
                      control={<Radio disabled={!!feedback} />}
                      label={opt}
                      sx={{
                        mb: 1, px: 1.5, borderRadius: 2,
                        border: '1px solid', borderColor, bgcolor,
                        transition: 'all 0.15s',
                      }}
                    />
                  );
                })}
              </RadioGroup>
            )}

            {currentQuestion.type === 'short_answer' && (
              <TextField
                fullWidth placeholder="Type your answer…"
                value={openText}
                onChange={e => { if (!feedback) setOpenText(e.target.value); }}
                disabled={!!feedback}
                size="small"
              />
            )}

            {currentQuestion.type === 'open_ended' && (
              <TextField
                fullWidth multiline rows={4}
                placeholder="Write your explanation…"
                value={openText}
                onChange={e => { if (!feedback) setOpenText(e.target.value); }}
                disabled={!!feedback}
              />
            )}
          </CardContent>
        </Card>

        {feedback && (
          <Card sx={{
            mb: 3, border: 2,
            borderColor: feedback.isCorrect ? 'success.main' : 'error.main',
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                {feedback.isCorrect
                  ? <CheckCircle color="success" />
                  : <Cancel color="error" />}
                <Typography sx={{ fontWeight: 700, color: feedback.isCorrect ? 'success.dark' : 'error.dark' }}>
                  {feedback.isCorrect ? 'Correct!' : 'Not quite'}
                </Typography>
              </Box>
              <Typography variant="body2">{feedback.feedback}</Typography>
              {currentQuestion.sourceExcerpt && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Source: "{currentQuestion.sourceExcerpt}"
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Box>
          {!feedback ? (
            <Button
              variant="contained" fullWidth size="large"
              onClick={handleSubmitAnswer}
              disabled={submitting || !userAnswer.trim()}
              startIcon={submitting ? <CircularProgress size={18} /> : undefined}
            >
              {submitting ? 'Checking…' : 'Submit Answer'}
            </Button>
          ) : (
            <Button
              variant="contained" fullWidth size="large"
              endIcon={isLastQuestion ? <EmojiEvents /> : <ArrowForward />}
              onClick={handleNext}
            >
              {isLastQuestion ? 'See Results' : 'Next Question'}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────

  if (step === 'results' && session) {
    const pct = session.score;
    const scoreColor: 'success' | 'warning' | 'error' = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'error';

    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 640, mx: 'auto', width: '100%' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Quiz Complete!</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>Here's how you did</Typography>

        <Card sx={{ mb: 4, textAlign: 'center', p: 3 }}>
          <Avatar sx={{
            width: 80, height: 80, bgcolor: `${scoreColor}.main`,
            fontSize: 26, fontWeight: 700, mx: 'auto', mb: 2,
          }}>
            {pct}%
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {session.correctAnswers} / {session.totalQuestions} correct
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {pct >= 80
              ? '🎉 Excellent work!'
              : pct >= 60
                ? '👍 Good effort — keep going!'
                : '💪 Keep practising — you\'ll get there!'}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
            <Chip label={DIFFICULTY_META[session.difficulty].label} color={DIFFICULTY_META[session.difficulty].color} />
            <Chip label={`${session.totalQuestions} questions`} variant="outlined" />
          </Box>
        </Card>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Question Review</Typography>
        <Stack spacing={2} sx={{ mb: 4 }}>
          {session.questions.map((q, i) => (
            <Card key={q.id} sx={{
              border: 1,
              borderColor: q.isCorrect === true ? 'success.main' : q.isCorrect === false ? 'error.main' : 'divider',
            }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Box sx={{ pt: 0.3 }}>
                    {q.isCorrect === true
                      ? <CheckCircle color="success" fontSize="small" />
                      : q.isCorrect === false
                        ? <Cancel color="error" fontSize="small" />
                        : <QuizIcon color="disabled" fontSize="small" />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Q{i + 1}: {q.question}
                    </Typography>
                    {q.userAnswer && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Your answer: {q.userAnswer}
                      </Typography>
                    )}
                    {q.isCorrect === false && q.correctAnswer && (
                      <Typography variant="caption" color="success.main" display="block">
                        Correct: {q.correctAnswer}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained" fullWidth size="large"
            startIcon={<Refresh />}
            onClick={handleRestart}
          >
            Take Another Quiz
          </Button>
          <Button
            variant="outlined" fullWidth size="large"
            startIcon={<HistoryIcon />}
            onClick={() => setHistoryTab(true)}
          >
            View History
          </Button>
        </Stack>
      </Box>
    );
  }

  return null;
}
