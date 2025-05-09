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
    
    console.log('Script loaded successfully');
    
    // Original sample recipe data (fallback if API is down)
    const localRecipes = [
        // Your local recipes here (same as before)
    ];
    
    // Add click event to the search button
    searchBtn.addEventListener('click', function() {
        // Show loading state
        resultsDiv.innerHTML = '<div class="loading">Searching for recipes...</div>';
        
        // Get the ingredients from the input and convert to lowercase
        const searchIngredientsText = ingredientsInput.value.trim().toLowerCase();
        
        // Check if the input is empty
        if (!searchIngredientsText) {
            resultsDiv.innerHTML = '<p>Please enter at least one ingredient</p>';
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
                // Clear results
                resultsDiv.innerHTML = '';
                
                // Check if recipes were found
                if (!data.meals) {
                    resultsDiv.innerHTML = `<p>No recipes found with ${mainIngredient}. Try a different ingredient!</p>`;
                    return;
                }
                
                // Storage for processed recipes
                let processedRecipes = [];
                let completedRequests = 0;
                
                // Display a header showing search terms
                const searchTerms = searchIngredients.join(', ');
                resultsDiv.innerHTML = `
                    <h3>Searching for recipes with: ${searchTerms}</h3>
                    <div class="loading">Finding matches...</div>
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
                    <p>Couldn't connect to recipe database. Showing local recipes instead:</p>
                `;
                
                // Filter local recipes based on ingredients
                displayLocalRecipes(searchIngredients);
            });
    });
    
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
            resultsDiv.innerHTML = `<p>No recipes found matching all your ingredients. Try fewer ingredients or different combinations.</p>`;
            return;
        }
        
        // Display a header with the count of recipes found
        resultsDiv.innerHTML = `<h3>Found ${recipes.length} recipes matching your ingredients</h3>`;
        
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
                
                // Create recipe card
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                recipeCard.innerHTML = `
                    <h2>${recipeDetails.strMeal}</h2>
                    <div class="match-info">
                        <span class="match-badge">${recipe.matchCount} of ${recipe.totalSearched} ingredients matched</span>
                    </div>
                    <img src="${recipeDetails.strMealThumb}" alt="${recipeDetails.strMeal}" style="max-width:100%; border-radius:8px;">
                    <p><strong>Category:</strong> ${recipeDetails.strCategory}</p>
                    <p><strong>Origin:</strong> ${recipeDetails.strArea}</p>
                    <div class="ingredients">
                        <strong>Ingredients:</strong>
                        <ul>
                            ${ingredients.join('')}
                        </ul>
                    </div>
                    <div class="instructions">
                        <strong>Instructions:</strong>
                        <p>${recipeDetails.strInstructions}</p>
                    </div>
                    ${recipeDetails.strYoutube ? `
                    <div class="video-link">
                        <a href="${recipeDetails.strYoutube}" target="_blank">Watch Video Tutorial</a>
                    </div>` : ''}
                `;
                
                // Add the recipe card to the results
                resultsDiv.appendChild(recipeCard);
            } else {
                // For recipes without detailed processing (should not happen in this flow)
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                recipeCard.innerHTML = `
                    <h2>${recipe.strMeal}</h2>
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" style="max-width:100%; border-radius:8px;">
                    <p>Basic recipe information. Search again for details.</p>
                `;
                resultsDiv.appendChild(recipeCard);
            }
        });
    }
    
    // Function to display local recipes
    function displayLocalRecipes(searchIngredients) {
        // Flag to track if any recipes were found
        let recipesFound = false;
        
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
                    <h2>${recipe.name}</h2>
                    ${recipe.thumbnail ? `<img src="${recipe.thumbnail}" alt="${recipe.name}" style="max-width:100%; border-radius:8px;">` : ''}
                    <div class="match-info">
                        <span class="match-badge">${matchingIngredients.length} of ${searchIngredients.length} ingredients matched</span>
                    </div>
                    <p><strong>Matching ingredients:</strong> ${matchingIngredients.join(', ')}</p>
                    <p><strong>All ingredients:</strong> ${recipe.ingredients.join(', ')}</p>
                    <p><strong>Prep time:</strong> ${recipe.prepTime}</p>
                    <p><strong>Instructions:</strong> ${recipe.instructions}</p>
                `;
                
                // Add the recipe card to the results
                resultsDiv.appendChild(recipeCard);
            }
        });
        
        // If no local recipes were found, show a message
        if (!recipesFound) {
            resultsDiv.innerHTML += '<p>No local recipes found with those ingredients. Try different ingredients!</p>';
        }
    }
    
    console.log('Script initialization complete');
});
