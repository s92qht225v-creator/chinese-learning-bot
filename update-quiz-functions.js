        // Update quiz form fields based on selected type
        function updateQuizFormFields() {
            const quizType = document.getElementById('quizType').value;
            const optionsField = document.getElementById('optionsField');
            const pairsField = document.getElementById('pairsField');
            const audioField = document.getElementById('audioField');
            const quizAnswer = document.getElementById('quizAnswer');

            optionsField.style.display = 'none';
            pairsField.style.display = 'none';
            audioField.style.display = 'none';

            switch(quizType) {
                case 'chinese_to_uzbek':
                case 'uzbek_to_chinese':
                case 'pinyin_to_chinese':
                case 'chinese_to_pinyin':
                case 'fill_blank':
                case 'multiple_choice':
                    optionsField.style.display = 'block';
                    break;

                case 'true_false':
                    optionsField.style.display = 'block';
                    document.getElementById('quizOptions').value = "To'g'ri, Noto'g'ri";
                    document.getElementById('quizOptions').readOnly = true;
                    break;

                case 'audio_to_character':
                    optionsField.style.display = 'block';
                    audioField.style.display = 'block';
                    break;

                case 'match_pairs':
                    pairsField.style.display = 'block';
                    quizAnswer.value = 'matches';
                    quizAnswer.readOnly = true;
                    break;

                case 'typing':
                    break;
            }
        }

