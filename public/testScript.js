

document.addEventListener('DOMContentLoaded', function () {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const testContainer = document.getElementById('test-container');
    const testForm = document.getElementById('test-form');
    async function addProgramToUser(userId, programId) {
        try {
            const response = await fetch(`https://backend-dep-aq9c.onrender.com/add-program/${userId}/${programId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                console.log('Program added successfully!');
            } else {
                console.error('Failed to add program:', data.error);
            }
        } catch (error) {
            console.error('Error adding program:', error);
        }
    }
    async function startTest(language) {
        try {
            const { questions, correctAnswers } = await fetchTestQuestions(language);

            console.log('Fetched Questions:', questions);
            console.log('Correct Answers:', correctAnswers);

            if (!questions || !correctAnswers) {
                console.error('Error: Questions or correctAnswers are undefined.');
                return;
            }

            displayTestQuestions(questions);

            return { questions, correctAnswers };
        } catch (error) {
            console.error('Error starting test:', error);
        }
    }

    async function addProgram(userId, programId) {
        try {
            const response = await fetch(`https://backend-dep-aq9c.onrender.com/add-program/${userId}/${programId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                console.log('Program added successfully!');
            } else {
                console.error('Failed to add program:', data.error);
            }
        } catch (error) {
            console.error('Error adding program:', error);
        }
    }
    async function fetchTestQuestions(language) {
        const response = await fetch(`https://backend-dep-aq9c.onrender.com/getTestQuestions/${language}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        console.log('Test Questions Response:', response);

        if (!response.ok) {
            console.error('Error fetching test questions:', response.statusText);
            return { questions: [], correctAnswers: [] };
        }

        const { questions, correctAnswers } = await response.json();
        console.log('Fetched Questions:', questions);
        console.log('Correct Answers:', correctAnswers);

        return { questions, correctAnswers };
    }

    function gatherUserAnswers(correctAnswers) {
        let score = 0;
//radio not null
        document.querySelectorAll('input[type="radio"]:checked').forEach((input) => {
            const answerIndex = parseInt(input.value);

            if (!isNaN(answerIndex) && correctAnswers.includes(answerIndex.toString())) {
                score++;
            }
        });

        console.log('Selected Answers:', document.querySelectorAll('input[type="radio"]:checked'));
        console.log('Score:', score);

        return score;
    }




    function displayTestQuestions(questions) {
        testForm.innerHTML = '';

        questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('mb-3');

            const questionLabel = document.createElement('label');
            questionLabel.classList.add('form-label');
            questionLabel.textContent = `${index + 1}. ${question.text}`;

            questionDiv.appendChild(questionLabel);

            question.options.forEach((option, optionIndex) => {
                const optionLabel = document.createElement('label');
                optionLabel.classList.add('form-check', 'form-check-inline');

                const optionInput = document.createElement('input');
                optionInput.classList.add('form-check-input');
                optionInput.type = 'radio';
                optionInput.name = `question${index}`;
                optionInput.classList.add('form-check-input');
                optionInput.type = 'radio';
                optionInput.name = `question${index}`;
                optionInput.value = option;

                const optionText = document.createElement('span');
                optionText.classList.add('form-check-label');
                optionText.textContent = option;

                optionLabel.appendChild(optionInput);
                optionLabel.appendChild(optionText);

                questionDiv.appendChild(optionLabel);
            });

            testForm.appendChild(questionDiv);
        });

        testContainer.style.display = 'block';
    }


    document.getElementById('englishButton').addEventListener('click', async () => {
        const { correctAnswers } = await startTest('english');
        console.log('Starting English Test...');
        console.log('Correct Answers:', correctAnswers);

    });



    window.submitTest = async function () {
        try {
            const { questions, correctAnswers } = await startTest('english');
            const score = gatherUserAnswers(correctAnswers);
            let programId;
            const userId = localStorage.getItem('userId');
            if (score >= 0 && score <= 5) {
                programId = "65c3aa1c0266c5a5732b851a";
            } else if (score >= 6 && score <= 8) {
                programId = "65c3aa1c0266c5a5732b851b";
            } else if (score >= 9 && score <= 10) {
                programId = "65c3aa1c0266c5a5732b851c";
            }

            addProgram(userId, programId);

            console.log('Final Score:', score);
            console.log('Correct Answers:', correctAnswers);


            const token = localStorage.getItem('token');
            const language = 'english';
            const requestBody = { language, score };

            const response = await fetch(`https://backend-dep-aq9c.onrender.com/saveTestScores/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (data.success) {
                console.log('Test scores saved successfully!');

                await addProgram(userId, score);
            } else {
                console.error('Failed to save test scores:', data.error);
            }
        } catch (error) {
            console.error('Error during the test:', error);
        }
    };

});
