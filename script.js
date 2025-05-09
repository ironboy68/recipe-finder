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
    searchBtn.addEventListener('click', function() {
        // Show loading state
        resultsDiv.innerHTML = '<div class="loading">Searching for recipes...</div>';
        
        // Get the ingredients from the input and convert to lowercase
        const searchIngredients = ingredientsInput.value.trim().toLowerCase();
        
        // Check if the input is empty
        if (!searchIngredients) {
            resultsDiv.innerHTML = '<p>Please enter at least one ingredient</p>';
            return;
        }
        
        // Use the main ingredient as search term for TheMealDB
        const mainIngredient = searchIngredients.split(',')[0].trim();
        
        // Call TheMealDB API
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
                
                // Display a header with the count of recipes found
                resultsDiv.innerHTML = `<h3>Found ${data.meals.length} recipes with ${mainIngredient}</h3>`;
                
                // Process up to 10 meals to avoid too many requests
                const mealsToProcess = data.meals.slice(0, 10);
                
                // Fetch detailed information for each meal and display
                mealsToProcess.forEach(meal => {
                    fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`)
                        .then(response => response.json())
                        .then(detailData => {
                            const recipeDetails = detailData.meals[0];
                            
                            // Extract ingredients and measurements
                            const ingredients = [];
                            for (let i = 1; i <= 20; i++) {
                                const ingredient = recipeDetails[`strIngredient${i}`];
                                const measure = recipeDetails[`strMeasure${i}`];
                                
                                if (ingredient && ingredient.trim() !== '') {
                                    ingredients.push(`${measure} ${ingredient}`.trim());
                                }
                            }
                            
                            // Create recipe card
                            const recipeCard = document.createElement('div');
                            recipeCard.className = 'recipe-card';
                            recipeCard.innerHTML = `
                                <h2>${recipeDetails.strMeal}</h2>
                                <img src="${recipeDetails.strMealThumb}" alt="${recipeDetails.strMeal}" style="max-width:100%; border-radius:8px;">
                                <p><strong>Category:</strong> ${recipeDetails.strCategory}</p>
                                <p><strong>Origin:</strong> ${recipeDetails.strArea}</p>
                                <div class="ingredients">
                                    <strong>Ingredients:</strong>
                                    <ul>
                                        ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
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
                        })
                        .catch(error => {
                            console.error('Error fetching recipe details:', error);
                            // Create a simpler recipe card with less details
                            const recipeCard = document.createElement('div');
                            recipeCard.className = 'recipe-card';
                            recipeCard.innerHTML = `
                                <h2>${meal.strMeal}</h2>
                                <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="max-width:100%; border-radius:8px;">
                                <p>Error loading full recipe details.</p>
                            `;
                            resultsDiv.appendChild(recipeCard);
                        });
                });
            })
            .catch(error => {
                console.error('Error fetching from TheMealDB:', error);
                // Show error message and fall back to local recipes
                resultsDiv.innerHTML = `
                    <p>Couldn't connect to recipe database. Showing local recipes instead:</p>
                `;
                
                // Parse search ingredients into an array
                const searchIngredientsArray = searchIngredients.split(',').map(item => item.trim());
                
                // Flag to track if any recipes were found
                let recipesFound = false;
                
                // Filter local recipes based on ingredients
                localRecipes.forEach(recipe => {
                    // Check if at least one search ingredient is in the recipe
                    const hasMatchingIngredient = searchIngredientsArray.some(ingredient => 
                        recipe.ingredients.includes(ingredient)
                    );
                    
                    if (hasMatchingIngredient) {
                        recipesFound = true;
                        
                        // Create a recipe card
                        const recipeCard = document.createElement('div');
                        recipeCard.className = 'recipe-card';
                        
                        // Calculate how many matching ingredients
                        const matchCount = searchIngredientsArray.filter(ingredient => 
                            recipe.ingredients.includes(ingredient)
                        ).length;
                        
                        // Create the recipe card HTML
                        recipeCard.innerHTML = `
                            <h2>${recipe.name}</h2>
                            ${recipe.thumbnail ? `<img src="${recipe.thumbnail}" alt="${recipe.name}" style="max-width:100%; border-radius:8px;">` : ''}
                            <p><strong>Matching ingredients:</strong> ${matchCount} of ${searchIngredientsArray.length}</p>
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
            });
    });
    
    console.log('Script initialization complete');
});
