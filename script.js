document.addEventListener('DOMContentLoaded', function() {
    // Get references to the HTML elements
    const searchBtn = document.getElementById('search-btn');
    const ingredientsInput = document.getElementById('ingredients');
    const resultsDiv = document.getElementById('results');
    
    // Check if elements exist
    if (!searchBtn || !ingredientsInput || !resultsDiv) {
        console.error('One or more required HTML elements not found');
        return;
    }
    
    // Original sample recipe data (fallback if API is down)
    const localRecipes = [
        {
            name: "Pasta with Tomato Sauce",
            ingredients: ["pasta", "tomato", "garlic", "olive oil", "basil"],
            instructions: "Cook pasta. Sauté garlic in olive oil. Add tomatoes and cook for 10 minutes. Add basil and serve over pasta.",
            prepTime: "20 minutes",
            thumbnail: "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg"
        },
        {
            name: "Vegetable Stir Fry",
            ingredients: ["broccoli", "carrot", "pepper", "soy sauce", "rice"],
            instructions: "Cook rice. Stir fry vegetables. Add soy sauce. Serve over rice.",
            prepTime: "15 minutes",
            thumbnail: "https://www.themealdb.com/images/media/meals/xutquv1505330523.jpg"
        },
        {
            name: "Chicken Sandwich",
            ingredients: ["chicken", "bread", "lettuce", "tomato", "mayonnaise"],
            instructions: "Grill chicken. Toast bread. Assemble sandwich with all ingredients.",
            prepTime: "10 minutes",
            thumbnail: "https://www.themealdb.com/images/media/meals/sbx7n71587673021.jpg"
        },
        {
            name: "Vegetable Soup",
            ingredients: ["carrot", "potato", "onion", "celery", "vegetable broth"],
            instructions: "Dice vegetables. Add to pot with broth. Simmer for 30 minutes.",
            prepTime: "40 minutes",
            thumbnail: "https://www.themealdb.com/images/media/meals/2x5jwe1619006953.jpg"
        },
        {
            name: "Simple Salad",
            ingredients: ["lettuce", "tomato", "cucumber", "olive oil", "vinegar"],
            instructions: "Chop vegetables. Mix together. Dress with olive oil and vinegar.",
            prepTime: "5 minutes",
            thumbnail: "https://www.themealdb.com/images/media/meals/wvqpwt1468339226.jpg"
        }
    ];
    
    // Add click event to the search button
    searchBtn.addEventListener('click', performSearch);
    
    // Add enter key event on input field
    ingredientsInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });
    
    function performSearch() {
        // Show loading state
        resultsDiv.innerHTML = '<div class="loading">Searching for delicious recipes...</div>';
        
        // Get the ingredients from the input and convert to lowercase
        const searchIngredientsText = ingredientsInput.value.trim().toLowerCase();
        
        // Check if the input is empty
        if (!searchIngredientsText) {
            resultsDiv.innerHTML = '<div class="no-results"><p>Please enter at least one ingredient to start cooking!</p></div>';
            return;
        }
        
        // Parse all ingredients
        const searchIngredients = searchIngredientsText.split(',')
            .map(item => item.trim())
            .filter(item => item !== '');
        
        // Use the first ingredient as the main search term for TheMealDB
        const mainIngredient = searchIngredients[0];
        
        // Additional ingredients to filter by
        const additionalIngredients = searchIngredients.slice(1);
        
        // Call TheMealDB API with main ingredient
        fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${mainIngredient}`)
            .then(response => response.json())
            .then(data => {
                // Check if recipes were found
                if (!data.meals) {
                    resultsDiv.innerHTML = `<div class="no-results">
                        <p>No recipes found with "${mainIngredient}".</p>
                        <p>Try a different ingredient or check your spelling!</p>
                    </div>`;
                    return;
                }
                
                // Storage for processed recipes
                let processedRecipes = [];
                let completedRequests = 0;
                
                // Display a header showing search terms
                const searchTerms = searchIngredients.join(', ');
                resultsDiv.innerHTML = `
                    <h3>Finding the perfect recipes with ${searchTerms}</h3>
                    <div class="loading">Discovering matches...</div>
                `;
                
                // Process up to 15 meals (to avoid too many requests)
                const mealsToProcess = data.meals.slice(0, 15);
                
                // If no additional ingredients, just display first ingredient results
                if (additionalIngredients.length === 0) {
                    displayFilteredRecipes(mealsToProcess, []);
                    return;
                }
                
                // Fetch detailed information for each meal
                mealsToProcess.forEach(meal => {
                    fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
                        .then(response => response.json())
                        .then(detailData => {
                            completedRequests++;
                            
                            const recipeDetails = detailData.meals[0];
                            
                            // Extract ingredients
                            const recipeIngredients = [];
                            for (let i = 1; i <= 20; i++) {
                                const ingredient = recipeDetails[`strIngredient${i}`];
                                if (ingredient && ingredient.trim() !== '') {
                                    recipeIngredients.push(ingredient.toLowerCase());
                                }
                            }
                            
                            // Check if the recipe contains additional searched ingredients
                            const matchingIngredients = additionalIngredients.filter(ingredient => 
                                recipeIngredients.some(recipeIng => recipeIng.includes(ingredient))
                            );
                            
                            // Store recipe and its matching ingredients
                            processedRecipes.push({
                                details: recipeDetails,
                                matchCount: matchingIngredients.length + 1, // +1 for the main ingredient
                                totalSearched: searchIngredients.length,
                                matchedIngredients: [mainIngredient, ...matchingIngredients]
                            });
                            
                            // After all requests are completed, display filtered recipes
                            if (completedRequests === mealsToProcess.length) {
                                displayFilteredRecipes(processedRecipes, additionalIngredients);
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching recipe details:', error);
                            completedRequests++;
                            
                            // After all requests are completed, display filtered recipes
                            if (completedRequests === mealsToProcess.length) {
                                displayFilteredRecipes(processedRecipes, additionalIngredients);
                            }
                        });
                });
            })
            .catch(error => {
                console.error('Error fetching from TheMealDB:', error);
                // Show error message and fall back to local recipes
                resultsDiv.innerHTML = `
                    <div class="no-results">
                        <p>Couldn't connect to the recipe database.</p>
                        <p>Showing local recipes instead:</p>
                    </div>
                `;
                
                // Filter local recipes based on ingredients
                displayLocalRecipes(searchIngredients);
            });
    }
    
    // Function to display filtered recipes
    function displayFilteredRecipes(recipes, additionalIngredients) {
        // Sort recipes by number of matching ingredients (descending)
        if (additionalIngredients.length > 0) {
            recipes.sort((a, b) => b.matchCount - a.matchCount);
            
            // Only keep recipes that match at least one additional ingredient (if searching for multiple)
            if (additionalIngredients.length > 0) {
                recipes = recipes.filter(recipe => recipe.matchCount > 1);
            }
        }
        
        // Clear the loading indicator
        resultsDiv.innerHTML = '';
        
        // Check if any matching recipes were found
        if (recipes.length === 0) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    <p>No recipes found matching all your ingredients.</p>
                    <p>Try fewer ingredients or different combinations!</p>
                </div>`;
            return;
        }
        
        // Display a header with the count of recipes found
        resultsDiv.innerHTML = `<h3>Found ${recipes.length} delicious recipes for you!</h3>
                                <div class="recipe-grid"></div>`;
        
        const recipeGrid = resultsDiv.querySelector('.recipe-grid');
        
        // Display each recipe
        recipes.forEach(recipe => {
            // If the recipe is already processed with details
            if (recipe.details) {
                const recipeDetails = recipe.details;
                
                // Extract ingredients and measurements
                const ingredients = [];
                for (let i = 1; i <= 20; i++) {
                    const ingredient = recipeDetails[`strIngredient${i}`];
                    const measure = recipeDetails[`strMeasure${i}`];
                    
                    if (ingredient && ingredient.trim() !== '') {
                        const fullIngredient = `${measure} ${ingredient}`.trim();
                        
                        // Highlight matching ingredients
                        const isMatching = recipe.matchedIngredients.some(
                            matchIng => ingredient.toLowerCase().includes(matchIng)
                        );
                        
                        if (isMatching) {
                            ingredients.push(`<li class="matching-ingredient">${fullIngredient}</li>`);
                        } else {
                            ingredients.push(`<li>${fullIngredient}</li>`);
                        }
                    }
                }
                
                // Process instructions for better formatting
                const instructions = recipeDetails.strInstructions
                    .replace(/\r\n/g, '\n')
                    .replace(/\n\n/g, '\n')
                    .trim();
                
                // Create recipe card
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                recipeCard.innerHTML = `
                    <img src="${recipeDetails.strMealThumb}" alt="${recipeDetails.strMeal}" class="recipe-image">
                    <div class="recipe-content">
                        <h2>${recipeDetails.strMeal}</h2>
                        
                        <div>
                            <span class="match-badge">${recipe.matchCount} of ${recipe.totalSearched} ingredients matched</span>
                        </div>
                        
                        <div class="recipe-meta">
                            <span class="category-badge">${recipeDetails.strCategory}</span>
                            <span class="origin-badge">${recipeDetails.strArea}</span>
                        </div>
                        
                        <div class="ingredients">
                            <h3>Ingredients</h3>
                            <ul>
                                ${ingredients.join('')}
                            </ul>
                        </div>
                        
                        <div class="instructions">
                            <h3>Instructions</h3>
                            <div class="collapse-content" id="instructions-${recipeDetails.idMeal}">
                                <p>${instructions}</p>
                            </div>
                            <button class="collapse-btn" onclick="toggleInstructions('instructions-${recipeDetails.idMeal}', this)">
                                Show instructions
                            </button>
                        </div>
                        
                        <div class="card-footer">
                            ${recipeDetails.strYoutube ? `
                            <div class="video-link">
                                <a href="${recipeDetails.strYoutube}" target="_blank">Watch Video</a>
                            </div>` : '<div></div>'}
                        </div>
                    </div>
                `;
                
                // Add the recipe card to the grid
                recipeGrid.appendChild(recipeCard);
            } else {
                // For recipes without detailed processing (should not happen in this flow)
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                recipeCard.innerHTML = `
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-image">
                    <div class="recipe-content">
                        <h2>${recipe.strMeal}</h2>
                        <p>Basic recipe information. Search again for details.</p>
                    </div>
                `;
                recipeGrid.appendChild(recipeCard);
            }
        });
        
        // Add the toggle instructions function to window scope
        window.toggleInstructions = function(id, button) {
            const element = document.getElementById(id);
            if (element.classList.contains('collapsed')) {
                element.classList.remove('collapsed');
                button.textContent = 'Hide instructions';
                button.classList.add('expanded');
            } else {
                element.classList.add('collapsed');
                button.textContent = 'Show instructions';
                button.classList.remove('expanded');
            }
        };
        
        // Collapse all instructions initially
        recipes.forEach(recipe => {
            if (recipe.details) {
                const instructionsElement = document.getElementById(`instructions-${recipe.details.idMeal}`);
                if (instructionsElement) {
                    instructionsElement.classList.add('collapsed');
                }
            }
        });
    }
    
    // Function to display local recipes
    function displayLocalRecipes(searchIngredients) {
        // Flag to track if any recipes were found
        let recipesFound = false;
        
        const recipeGrid = document.createElement('div');
        recipeGrid.className = 'recipe-grid';
        resultsDiv.appendChild(recipeGrid);
        
        // Filter local recipes based on ingredients
        localRecipes.forEach(recipe => {
            // Check if at least one search ingredient is in the recipe
            const matchingIngredients = searchIngredients.filter(ingredient => 
                recipe.ingredients.some(recipeIng => recipeIng.includes(ingredient))
            );
            
            if (matchingIngredients.length > 0) {
                recipesFound = true;
                
                // Create a recipe card
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                
                // Create the recipe card HTML
                recipeCard.innerHTML = `
                    ${recipe.thumbnail ? `<img src="${recipe.thumbnail}" alt="${recipe.name}" class="recipe-image">` : ''}
                    <div class="recipe-content">
                        <h2>${recipe.name}</h2>
                        
                        <div>
                            <span class="match-badge">${matchingIngredients.length} of ${searchIngredients.length} ingredients matched</span>
                        </div>
                        
                        <div class="ingredients">
                            <h3>Ingredients</h3>
                            <ul>
                                ${recipe.ingredients.map(ing => {
                                    const isMatching = matchingIngredients.some(m => ing.includes(m));
                                    return isMatching 
                                        ? `<li class="matching-ingredient">${ing}</li>` 
                                        : `<li>${ing}</li>`;
                                }).join('')}
                            </ul>
                        </div>
                        
                        <div class="instructions">
                            <h3>Instructions</h3>
                            <p>${recipe.instructions}</p>
                        </div>
                        
                       <div class="card-footer">
                            <p>Prep time: ${recipe.prepTime}</p>
                        </div>
                    </div>
                `;
                
                // Add the recipe card to the grid
                recipeGrid.appendChild(recipeCard);
            }
        });
        
        // If no local recipes were found, show a message
        if (!recipesFound) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    <p>No recipes found with those ingredients.</p>
                    <p>Try different ingredients or check your spelling!</p>
                </div>`;
        }
    }
});
