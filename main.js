document.querySelector('.loginDiv').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.querySelector('.loginButton').click();
    }
  });

const users = [
    {username: 'user', password: 'user'},
    {username: 'admin', password: 'admin'}
];

const pollVotes = {
    polls: {}
};

const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.querySelector('.loginButton');
const adminDiv = document.querySelector('.adminDiv');
const pollsDiv = document.querySelector('.pollsDiv');

let loggedIn = false;

function updatePollsMessage() {
    let placeholder = document.getElementById('noPollsMessage');
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.id = 'noPollsMessage';
        placeholder.textContent = "Ei aktiivisia äänestyksiä";
        pollsDiv.appendChild(placeholder);
    }

    const pollElements = Array.from(pollsDiv.children).filter(
        child => child.id !== 'noPollsMessage'
    );

    if (pollElements.length === 0) {
        placeholder.style.display = 'block';
    } else {
        placeholder.style.display = 'none';
    }
}



// Kirjautuminen
loginButton.addEventListener('click', function() {
    if (!loggedIn) {
        const username = usernameInput.value;
        const password = passwordInput.value;
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            alert('Olet nyt kirjautuneena käyttäjänä ' + username);

            usernameInput.style.display = 'none';
            passwordInput.style.display = 'none';
            loginButton.textContent = 'Kirjaudu ulos';

            loggedIn = true;

            if (username === 'admin') {
                adminDiv.style.display = "block";

                document.querySelectorAll('.deletePollButton').forEach(button => {
                    button.style.display = "block";
                });
            }

        } else {
            alert('Väärä käyttäjätunnus tai salasana!');
        }
    } else {
        usernameInput.style.display = 'inline';
        passwordInput.style.display = 'inline';
        loginButton.textContent = 'Kirjaudu sisään';

        loggedIn = false;

        adminDiv.style.display = 'none';

        document.querySelectorAll('.deletePollButton').forEach(button => {
            button.style.display = "none";
        });
    }
});




// Äänestäminen
function attachVoteListeners() {
    document.querySelectorAll('.pollButton').forEach(button => {
        if (!button.dataset.listenerAdded) {
            button.addEventListener('click', function() {

                const pollId = this.closest('.poll').id;
                const optionId = this.dataset.pollId;

                if (!loggedIn) {
                    alert('Kirjaudu sisään äänestääksesi!');
                } else {
                    pollVotes.polls[pollId].totalVotes += 1;
                    pollVotes.polls[pollId].options[optionId] += 1;

                    updatePercentages(pollId);
                }
            });

            button.dataset.listenerAdded = "true";
    }});
}

function updatePercentages(pollId) {
    const poll = pollVotes.polls[pollId];
    const totalVotes = poll.totalVotes;

    for (const optionId in poll.options) {
        const optionVotes = poll.options[optionId];
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        document.querySelector(`#${pollId} .pollButton[data-poll-id="${optionId}"] + .pollPercentage`).textContent = `${percentage}%`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updatePollsMessage();
    attachVoteListeners();
    attachDeleteListeners();
});



// Kyselyn luonti
function addPoll(pollId, question, options) {
    updatePollsMessage ();

    const pollDiv = document.createElement('div');
    pollDiv.className = 'poll';
    pollDiv.id = pollId;
    pollDiv.innerHTML = `
        <h1 class="pollH1">${question}</h1>
        <div class="pollOptions">
            ${options.map((option, index) => `
                <button class="pollButton" data-poll-id="${index + 1}">${option}</button><span class="pollPercentage">0%</span><br>
            `).join('')}
        </div>
                <button class="deletePollButton" data-poll-id="${pollId}" style="display: ${adminDiv.style.display};">X</button>
    `;

    document.querySelector('.pollsDiv').appendChild(pollDiv);
    
    pollVotes.polls[pollId] = {
        totalVotes: 0,
        options: Object.fromEntries(options.map((_, index) => [index + 1, 0]))
    };

    updatePollsMessage();
    attachVoteListeners();
    attachDeleteListeners();
}

document.getElementById('addOptionButton').addEventListener('click', () => {
    const container = document.getElementById('pollOptionsContainer');
    const optionCount = container.querySelectorAll('input').length + 1;
    const newInput = document.createElement('input');

    newInput.type = 'text';
    newInput.id = `option${optionCount}`;
    newInput.placeholder = 'Vastausvaihtoehto';
    newInput.className = 'pollInputField';

    container.appendChild(newInput);
});

document.getElementById('removeOptionButton').addEventListener('click', () => {
    const container = document.getElementById('pollOptionsContainer');
    const inputs = container.querySelectorAll('input');

    if (inputs.length > 2) {
        container.removeChild(inputs[inputs.length - 1]);
    }

    if (inputs.length <= 3) {
        document.getElementById('removeOptionButton').disabled = true;
    }
});

document.getElementById('addOptionButton').addEventListener('click', () => {
    const removeButton = document.getElementById('removeOptionButton');
    removeButton.disabled = false;
});

document.getElementById('createPollButton').addEventListener('click', () => {
    const question = document.getElementById('pollQuestion').value;
    const options = Array.from(document.querySelectorAll('#pollOptionsContainer input')).map(input => input.value);

    if (options.some(option => !option)) {
        alert('Kaikki vastausvaihtoehdot on täytettävä');
        return;
    }

    if (new Set(options).size !== options.length) {
        alert('Vastausvaihtoehdot eivät voi olla samanlaisia');
        return;
    }

    if (question && options.length > 0) {
        const pollId = `poll-${Date.now()}`;
        addPoll(pollId, question, options);

        document.getElementById('pollQuestion').value = '';
        document.querySelectorAll('#pollOptionsContainer input').forEach(input => (input.value = ''));

    } else {
        alert ('Kysymys ja vähintään kaksi vastausvaihtoehtoa vaaditaan.');
    }

    attachVoteListeners();

});



// Kyselyn poisto
function attachDeleteListeners() {
    document.querySelectorAll('.deletePollButton').forEach(button => {
        if (!button.dataset.listenerAdded) {
            button.addEventListener('click', function() {
                const pollId = this.dataset.pollId;

                if (confirm('Haluatko varmasti poistaa tämän äänestyksen?')) {
                    delete pollVotes.polls[pollId];
                    document.getElementById(pollId).remove();

                    updatePollsMessage();
                }
            });

            button.dataset.listenerAdded = "true";
        }
    });
}