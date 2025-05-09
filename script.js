// Wait for the page to finish loading
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
    
    // Sample recipe data (in a real app, this would come from an API)
    const recipes = [
        {
            name: "Pasta with Tomato Sauce",
            ingredients: ["pasta", "tomato", "garlic", "olive oil", "basil"],
            instructions: "Cook pasta. Sauté garlic in olive oil. Add tomatoes and cook for 10 minutes. Add basil and serve over pasta.",
            prepTime: "20 minutes"
        },
        {
            name: "Vegetable Stir Fry",
            ingredients: ["broccoli", "carrot", "pepper", "soy sauce", "rice"],
            instructions: "Cook rice. Stir fry vegetables. Add soy sauce. Serve over rice.",
            prepTime: "15 minutes"
        },
        {
            name: "Chicken Sandwich",
            ingredients: ["chicken", "bread", "lettuce", "tomato", "mayonnaise"],
            instructions: "Grill chicken. Toast bread. Assemble sandwich with all ingredients.",
            prepTime: "10 minutes"
        },
        {
            name: "Vegetable Soup",
            ingredients: ["carrot", "potato", "onion", "celery", "vegetable broth"],
            instructions: "Dice vegetables. Add to pot with broth. Simmer for 30 minutes.",
            prepTime: "40 minutes"
        },
        {
            name: "Simple Salad",
            ingredients: ["lettuce", "tomato", "cucumber", "olive oil", "vinegar"],
            instructions: "Chop vegetables. Mix together. Dress with olive oil and vinegar.",
            prepTime: "5 minutes"
        }
    ];
    
    // Add click event to the search button
    searchBtn.addEventListener('click', function() {
        console.log('Search button clicked');
        
        // Get the ingredients from the input and convert to lowercase
        const searchIngredients = ingredientsInput.value.toLowerCase().split(',').map(item => item.trim());
        
        // Clear previous results
        resultsDiv.innerHTML = '';
        
        // Check if there are any search ingredients
        if (searchIngredients.length === 0 || searchIngredients[0] === '') {
            resultsDiv.innerHTML = '<p>Please enter at least one ingredient</p>';
            return;
        }
        
        // Flag to track if any recipes were found
        let recipesFound = false;
        
        // Filter recipes based on ingredients
        recipes.forEach(recipe => {
            // Check if at least one search ingredient is in the recipe
            const hasMatchingIngredient = searchIngredients.some(ingredient => 
                recipe.ingredients.includes(ingredient)
            );
            
            if (hasMatchingIngredient) {
                recipesFound = true;
                
                // Create a recipe card
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                
                // Calculate how many matching ingredients
                const matchCount = searchIngredients.filter(ingredient => 
                    recipe.ingredients.includes(ingredient)
                ).length;
                
                // Create the recipe card HTML
                recipeCard.innerHTML = `
                    <h2>${recipe.name}</h2>
                    <p><strong>Matching ingredients:</strong> ${matchCount} of ${searchIngredients.length}</p>
                    <p><strong>All ingredients:</strong> ${recipe.ingredients.join(', ')}</p>
                    <p><strong>Prep time:</strong> ${recipe.prepTime}</p>
                    <p><strong>Instructions:</strong> ${recipe.instructions}</p>
                `;
                
                // Add the recipe card to the results
                resultsDiv.appendChild(recipeCard);
            }
        });
        
        // If no recipes were found, show a message
        if (!recipesFound) {
            resultsDiv.innerHTML = '<p>No recipes found with those ingredients. Try different ingredients!</p>';
        }
    });
    
    console.log('Script initialization complete');
});
