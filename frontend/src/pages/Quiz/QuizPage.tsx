import { useEffect, useState } from 'react';
import {
  Typography, Card, CardContent, Button, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Chip, Alert,
  LinearProgress, Radio, RadioGroup,
  TextField, Divider, Stack, Tooltip,
} from '@mui/material';
import {
  Quiz as QuizIcon, CheckCircle, Cancel, EmojiEvents,
  Refresh, History as HistoryIcon, ArrowForward,
} from '@mui/icons-material';
import axios from 'axios';
import { quizApi } from '../../api/quiz.api';
import type { QuizSession, QuizQuestion, AnswerFeedback, QuizDifficulty, ActiveQuizSession } from '../../api/quiz.api';
import { topicsApi } from '../../api/topics.api';
import type { Topic } from '../../api/topics.api';
import * as S from './QuizPage.styles';
import type { OptionState, AnswerStatus, ScoreColor } from './QuizPage.styles';

type Step = 'setup' | 'generating' | 'question' | 'results';

interface DifficultyMeta {
  label: string;
  color: 'success' | 'warning' | 'error';
  desc: string;
}

const DIFFICULTY_META: Record<QuizDifficulty, DifficultyMeta> = {
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
  const [session, setSession] = useState<ActiveQuizSession | null>(null);
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

  const handleStart = async () => {
    setError('');
    setStep('generating');
    try {
      const result = await quizApi.start({ topicId: topicId || undefined, difficulty, questionCount });
      setSession(result);
      setCurrentIdx(0);
      setFeedback(null);
      setSelectedOption('');
      setOpenText('');
      setStep('question');
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Failed to generate quiz. Make sure you have uploaded and processed documents.')
          : 'Failed to generate quiz. Make sure you have uploaded and processed documents.',
      );
      setStep('setup');
    }
  };

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
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Failed to submit answer')
          : 'Failed to submit answer',
      );
    } finally {
      setSubmitting(false);
    }
  };

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
      <S.PageRoot pageMaxWidth={800}>
        <S.HistoryBackButton>
          <Button startIcon={<QuizIcon />} onClick={() => setHistoryTab(false)}>
            Back to Quiz
          </Button>
        </S.HistoryBackButton>
        <S.HistoryTitle variant="h5">Quiz History</S.HistoryTitle>
        {history.length === 0 ? (
          <Card>
            <S.HistoryEmptyContent>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No quizzes taken yet.</Typography>
            </S.HistoryEmptyContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {history.map(s => (
              <Card key={s.id}>
                <S.HistoryEntryContent>
                  <S.HistoryAvatar score={s.score}>{s.score}%</S.HistoryAvatar>
                  <S.HistoryScoreBox>
                    <S.HistoryScoreTitle>
                      {DIFFICULTY_META[s.difficulty].label} · {s.totalQuestions} questions
                    </S.HistoryScoreTitle>
                    <Typography variant="body2" color="text.secondary">
                      {s.correctAnswers}/{s.totalQuestions} correct ·{' '}
                      {new Date(s.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </Typography>
                  </S.HistoryScoreBox>
                  <Chip
                    label={DIFFICULTY_META[s.difficulty].label}
                    color={DIFFICULTY_META[s.difficulty].color}
                    size="small"
                  />
                </S.HistoryEntryContent>
              </Card>
            ))}
          </Stack>
        )}
      </S.PageRoot>
    );
  }

  // ── Setup ───────────────────────────────────────────────────────────────────

  if (step === 'setup') {
    return (
      <S.PageRoot pageMaxWidth={640}>
        <S.SetupHeader>
          <div>
            <S.SetupTitle variant="h4">Quiz & Practice</S.SetupTitle>
            <S.SetupSubtitle color="text.secondary">
              Test your knowledge on your uploaded materials
            </S.SetupSubtitle>
          </div>
          <Tooltip title="View history">
            <Button startIcon={<HistoryIcon />} onClick={() => setHistoryTab(true)} variant="outlined" size="small">
              History
            </Button>
          </Tooltip>
        </S.SetupHeader>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <S.SetupSettingsCard>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Quiz settings</Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Topic (optional)</InputLabel>
              <Select value={topicId} label="Topic (optional)" onChange={e => setTopicId(e.target.value as string)}>
                <MenuItem value=""><em>All topics</em></MenuItem>
                {topics.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <S.DifficultyLabel variant="body2">Difficulty</S.DifficultyLabel>
            <S.DifficultyStack direction="row" spacing={1}>
              {(Object.keys(DIFFICULTY_META) as QuizDifficulty[]).map(d => (
                <S.DifficultyCard key={d} isSelected={difficulty === d} onClick={() => setDifficulty(d)}>
                  <S.DifficultyCardContent>
                    <Chip
                      label={DIFFICULTY_META[d].label}
                      color={DIFFICULTY_META[d].color}
                      size="small"
                      sx={{ mb: 0.5, pointerEvents: 'none' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {DIFFICULTY_META[d].desc}
                    </Typography>
                  </S.DifficultyCardContent>
                </S.DifficultyCard>
              ))}
            </S.DifficultyStack>

            <S.QuestionCountLabel variant="body2">Number of questions</S.QuestionCountLabel>
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
        </S.SetupSettingsCard>

        <Button variant="contained" size="large" fullWidth startIcon={<QuizIcon />} onClick={handleStart}>
          Start Quiz
        </Button>
      </S.PageRoot>
    );
  }

  // ── Generating ──────────────────────────────────────────────────────────────

  if (step === 'generating') {
    return (
      <S.CenteredLoader>
        <CircularProgress size={56} />
        <Typography variant="h6" color="text.secondary">Generating your quiz…</Typography>
        <Typography color="text.disabled">Claude is reading your materials and crafting questions</Typography>
      </S.CenteredLoader>
    );
  }

  // ── Question ────────────────────────────────────────────────────────────────

  if (step === 'question' && session && currentQuestion) {
    return (
      <S.PageRoot pageMaxWidth={720}>
        <S.QuestionHeader>
          <S.QuestionProgressRow>
            <Typography variant="body2" color="text.secondary">
              Question {currentIdx + 1} of {session.questions.length}
            </Typography>
            <Chip
              label={DIFFICULTY_META[session.difficulty].label}
              color={DIFFICULTY_META[session.difficulty].color}
              size="small"
            />
          </S.QuestionProgressRow>
          <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2, height: 6 }} />
        </S.QuestionHeader>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <S.QuestionCard>
          <CardContent>
            <S.QuestionText variant="h6">{currentQuestion.question}</S.QuestionText>

            {currentQuestion.type === 'multiple_choice' && (
              <RadioGroup value={selectedOption} onChange={e => { if (!feedback) setSelectedOption(e.target.value); }}>
                {currentQuestion.options?.map((opt, i) => {
                  let optionState: OptionState = 'default';
                  if (feedback) {
                    if (opt === feedback.correctAnswer) optionState = 'correct';
                    else if (opt === selectedOption && !feedback.isCorrect) optionState = 'incorrect';
                  }
                  return (
                    <S.AnswerOption
                      key={i}
                      value={opt}
                      optionState={optionState}
                      control={<Radio disabled={!!feedback} />}
                      label={opt}
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
        </S.QuestionCard>

        {feedback && (
          <S.FeedbackCard isCorrect={feedback.isCorrect}>
            <CardContent>
              <S.FeedbackHeader>
                {feedback.isCorrect ? <CheckCircle color="success" /> : <Cancel color="error" />}
                <S.FeedbackTitle isCorrect={feedback.isCorrect}>
                  {feedback.isCorrect ? 'Correct!' : 'Not quite'}
                </S.FeedbackTitle>
              </S.FeedbackHeader>
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
          </S.FeedbackCard>
        )}

        <div>
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
        </div>
      </S.PageRoot>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────

  if (step === 'results' && session) {
    const pct = session.score;
    const scoreColor: ScoreColor = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'error';

    return (
      <S.PageRoot pageMaxWidth={640}>
        <S.ResultsTitle variant="h4">Quiz Complete!</S.ResultsTitle>
        <S.ResultsSubtitle color="text.secondary">Here's how you did</S.ResultsSubtitle>

        <S.ResultsScoreCard>
          <S.ScoreAvatar scoreColor={scoreColor}>{pct}%</S.ScoreAvatar>
          <S.ResultsScoreText variant="h5">
            {session.correctAnswers} / {session.totalQuestions} correct
          </S.ResultsScoreText>
          <S.ResultsScoreDetail color="text.secondary">
            {pct >= 80
              ? '🎉 Excellent work!'
              : pct >= 60
                ? '👍 Good effort — keep going!'
                : '💪 Keep practising — you\'ll get there!'}
          </S.ResultsScoreDetail>
          <S.ResultsChipBox>
            <Chip label={DIFFICULTY_META[session.difficulty].label} color={DIFFICULTY_META[session.difficulty].color} />
            <Chip label={`${session.totalQuestions} questions`} variant="outlined" />
          </S.ResultsChipBox>
        </S.ResultsScoreCard>

        <S.ReviewTitle variant="subtitle1">Question Review</S.ReviewTitle>
        <S.ReviewStack spacing={2}>
          {session.questions.map((q, i) => {
            const answerStatus: AnswerStatus =
              q.isCorrect === true ? 'correct'
              : q.isCorrect === false ? 'incorrect'
              : 'unanswered';
            return (
              <S.ReviewCard key={q.id} answerStatus={answerStatus}>
                <S.ReviewCardContent>
                  <S.ReviewRow>
                    <S.ReviewIconBox>
                      {q.isCorrect === true
                        ? <CheckCircle color="success" fontSize="small" />
                        : q.isCorrect === false
                          ? <Cancel color="error" fontSize="small" />
                          : <QuizIcon color="disabled" fontSize="small" />}
                    </S.ReviewIconBox>
                    <S.ReviewAnswerBox>
                      <S.ReviewQuestionText variant="body2">
                        Q{i + 1}: {q.question}
                      </S.ReviewQuestionText>
                      {q.userAnswer && (
                        <S.ReviewUserAnswer variant="caption" color="text.secondary">
                          Your answer: {q.userAnswer}
                        </S.ReviewUserAnswer>
                      )}
                      {q.isCorrect === false && q.correctAnswer && (
                        <S.ReviewCorrectAnswer variant="caption" color="success.main">
                          Correct: {q.correctAnswer}
                        </S.ReviewCorrectAnswer>
                      )}
                    </S.ReviewAnswerBox>
                  </S.ReviewRow>
                </S.ReviewCardContent>
              </S.ReviewCard>
            );
          })}
        </S.ReviewStack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button variant="contained" fullWidth size="large" startIcon={<Refresh />} onClick={handleRestart}>
            Take Another Quiz
          </Button>
          <Button variant="outlined" fullWidth size="large" startIcon={<HistoryIcon />} onClick={() => setHistoryTab(true)}>
            View History
          </Button>
        </Stack>
      </S.PageRoot>
    );
  }

  return null;
}
