const form = document.querySelector('#searchForm');
const searchResults = document.querySelector('#searchResults');
const image = document.querySelectorAll('img');
const remove = document.querySelector('#remove');

form.addEventListener('submit', async function (e) {
    try {
        e.preventDefault();
        clearResults()
        const searchTerm = form.elements.query.value;
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchTerm}`);
        resultHeader();
        makeResults(res.data);
        form.elements.query.value = '';
    } catch {
        noDefinition();
        form.elements.query.value = ''
    }
})

const resultHeader = () => {
    const yourResults = document.createElement('H2');
    yourResults.innerHTML = "Here Are Your Results:";
    searchResults.appendChild(yourResults);
}

const noDefinition = () => {
    const searchTerm = form.elements.query.value;
    const noDef = document.createElement('H2');
    noDef.innerHTML = `Sorry, we can't find the definition of <span>"${searchTerm}"</span>. Please try again.`;
    searchResults.appendChild(noDef);
}

const makeResults = (words) => {
    for (let result of words) {
        const word = document.createElement('H3');
        word.innerHTML = `<hr> Word: ${result.word}`;
        searchResults.appendChild(word);
        const definition = document.createElement('H4');
        definition.innerText = `Definition: ${result.meanings[0].definitions[0].definition}`;
        searchResults.appendChild(definition);
        const example = document.createElement('H5');
        example.innerText = `Example: ${result.meanings[0].definitions[0].example}`;
        if (result.meanings[0].definitions[0].example !== undefined) {
            searchResults.appendChild(example);
        } if (result.meanings[0].definitions[0].example = null) {
            searchResults.appendChild("")
        }
    }
}

const clearResults = () => {
    while (searchResults.firstChild) {
        searchResults.removeChild(searchResults.firstChild);
    }
}