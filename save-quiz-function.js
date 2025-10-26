        async function saveQuiz(event) {
            event.preventDefault();
            const messageEl = document.getElementById('quizMessage');

            try {
                const quizType = document.getElementById('quizType').value;
                const optionsValue = document.getElementById('quizOptions').value;
                const pairsValue = document.getElementById('quizPairs').value;

                // Prepare quiz data
                const quizData = {
                    lesson_id: document.getElementById('quizLesson').value || null,
                    question: document.getElementById('quizQuestion').value,
                    question_type: quizType,
                    correct_answer: document.getElementById('quizAnswer').value,
                    explanation: document.getElementById('quizExplanation').value || null,
                    hsk_level: parseInt(document.getElementById('quizHskLevel').value),
                    audio_url: document.getElementById('quizAudioUrl').value || null,
                    options: null,
                    pairs: null
                };

                // Parse options if provided
                if (optionsValue && optionsValue.trim()) {
                    quizData.options = optionsValue.split(',').map(opt => opt.trim());
                }

                // Parse pairs if provided (for match_pairs type)
                if (pairsValue && pairsValue.trim()) {
                    try {
                        quizData.pairs = JSON.parse(pairsValue);
                    } catch (e) {
                        throw new Error('Invalid JSON format for pairs');
                    }
                }

                // Send to backend API
                const response = await fetch(`${API_BASE}/api/admin/quizzes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Password': ADMIN_PASSWORD
                    },
                    body: JSON.stringify(quizData)
                });

                if (!response.ok) throw new Error('Failed to add quiz');

                messageEl.innerHTML = '<div class="message success">Quiz added successfully!</div>';
                setTimeout(() => messageEl.innerHTML = '', 3000);

                event.target.reset();
                await loadQuizzes();
            } catch (error) {
                messageEl.innerHTML = `<div class="message error">Error: ${error.message}</div>`;
                setTimeout(() => messageEl.innerHTML = '', 3000);
            }
        }
