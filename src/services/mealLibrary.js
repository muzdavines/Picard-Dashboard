export const MEAL_LIBRARY = [
  {
    mealId: "meal_beef_tacos",
    name: "Beef Tacos",
    description: "Classic tacos with seasoned ground beef and all the fixings.",
    tags: ["beef", "Mexican", "family-favorite", "quick"],
    prepMinutes: 10, cookMinutes: 15, servings: 4,
    ingredients: [
      { ingredientId: "ing_bt_001", name: "ground beef", walmartSearchTerm: "ground beef 80/20 2 lb", qty: 2, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_bt_002", name: "taco shells", walmartSearchTerm: "taco shells hard 12 count", qty: 1, unit: "package", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_bt_003", name: "shredded cheddar cheese", walmartSearchTerm: "shredded cheddar cheese 8 oz", qty: 8, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_bt_004", name: "taco seasoning", walmartSearchTerm: "taco seasoning mix packet", qty: 1, unit: "packet", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_bt_005", name: "iceberg lettuce", walmartSearchTerm: "iceberg lettuce head", qty: 1, unit: "head", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_bt_006", name: "tomato", walmartSearchTerm: "roma tomatoes fresh", qty: 2, unit: "whole", storeSection: "produce", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_lemon_chicken",
    name: "Lemon Herb Chicken Thighs",
    description: "Juicy chicken thighs roasted with lemon, garlic and fresh herbs.",
    tags: ["chicken", "easy", "healthy"],
    prepMinutes: 10, cookMinutes: 35, servings: 4,
    ingredients: [
      { ingredientId: "ing_lc_001", name: "chicken thighs", walmartSearchTerm: "chicken thighs bone-in 3 lb", qty: 3, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_lc_002", name: "lemon", walmartSearchTerm: "lemons fresh", qty: 2, unit: "whole", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_lc_003", name: "garlic", walmartSearchTerm: "garlic bulb fresh", qty: 1, unit: "head", storeSection: "produce", isPantryStaple: true },
      { ingredientId: "ing_lc_004", name: "fresh rosemary", walmartSearchTerm: "fresh rosemary herbs", qty: 1, unit: "bunch", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_lc_005", name: "olive oil", walmartSearchTerm: "olive oil extra virgin 16 oz", qty: 3, unit: "tbsp", storeSection: "pantry", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_spaghetti_bolognese",
    name: "Spaghetti Bolognese",
    description: "Rich meat sauce slow-simmered over al dente spaghetti.",
    tags: ["beef", "Italian", "family-favorite"],
    prepMinutes: 15, cookMinutes: 45, servings: 6,
    ingredients: [
      { ingredientId: "ing_sb_001", name: "ground beef", walmartSearchTerm: "ground beef 80/20 1.5 lb", qty: 1.5, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_sb_002", name: "spaghetti", walmartSearchTerm: "spaghetti pasta 16 oz", qty: 16, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_sb_003", name: "marinara sauce", walmartSearchTerm: "marinara sauce jar 24 oz", qty: 24, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_sb_004", name: "yellow onion", walmartSearchTerm: "yellow onion large", qty: 1, unit: "whole", storeSection: "produce", isPantryStaple: true },
      { ingredientId: "ing_sb_005", name: "garlic", walmartSearchTerm: "garlic minced jar", qty: 3, unit: "cloves", storeSection: "produce", isPantryStaple: true },
      { ingredientId: "ing_sb_006", name: "parmesan cheese", walmartSearchTerm: "parmesan cheese grated 8 oz", qty: 8, unit: "oz", storeSection: "dairy", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_chicken_stir_fry",
    name: "Chicken Stir Fry",
    description: "Quick weeknight stir fry with tender chicken and crisp vegetables.",
    tags: ["chicken", "Asian", "quick", "healthy"],
    prepMinutes: 15, cookMinutes: 15, servings: 4,
    ingredients: [
      { ingredientId: "ing_csf_001", name: "chicken breast", walmartSearchTerm: "chicken breast boneless 2 lb", qty: 2, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_csf_002", name: "stir fry vegetables", walmartSearchTerm: "stir fry vegetable mix frozen 16 oz", qty: 16, unit: "oz", storeSection: "frozen", isPantryStaple: false },
      { ingredientId: "ing_csf_003", name: "soy sauce", walmartSearchTerm: "soy sauce low sodium 10 oz", qty: 4, unit: "tbsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_csf_004", name: "sesame oil", walmartSearchTerm: "sesame oil toasted 8 oz", qty: 2, unit: "tsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_csf_005", name: "white rice", walmartSearchTerm: "long grain white rice 5 lb", qty: 2, unit: "cups", storeSection: "pantry", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_homemade_pizza",
    name: "Homemade Pizza",
    description: "Family pizza night — everyone picks their own toppings.",
    tags: ["family-favorite", "fun", "customizable"],
    prepMinutes: 20, cookMinutes: 20, servings: 4,
    ingredients: [
      { ingredientId: "ing_hp_001", name: "pizza dough", walmartSearchTerm: "pizza dough ready made", qty: 2, unit: "balls", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_hp_002", name: "pizza sauce", walmartSearchTerm: "pizza sauce jar 14 oz", qty: 14, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_hp_003", name: "shredded mozzarella", walmartSearchTerm: "shredded mozzarella cheese 16 oz", qty: 16, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_hp_004", name: "pepperoni", walmartSearchTerm: "pepperoni slices 6 oz", qty: 6, unit: "oz", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_hp_005", name: "bell pepper", walmartSearchTerm: "bell peppers mixed", qty: 1, unit: "whole", storeSection: "produce", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_pot_roast",
    name: "Slow Cooker Pot Roast",
    description: "Fall-apart tender chuck roast with potatoes and carrots. Practically makes itself.",
    tags: ["beef", "slow-cooker", "comfort", "family-favorite"],
    prepMinutes: 20, cookMinutes: 360, servings: 6,
    ingredients: [
      { ingredientId: "ing_pr_001", name: "chuck roast", walmartSearchTerm: "beef chuck roast 3 lb", qty: 3, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_pr_002", name: "baby potatoes", walmartSearchTerm: "baby potatoes 1.5 lb bag", qty: 1.5, unit: "lb", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_pr_003", name: "carrots", walmartSearchTerm: "baby carrots 1 lb bag", qty: 1, unit: "lb", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_pr_004", name: "beef broth", walmartSearchTerm: "beef broth 32 oz", qty: 32, unit: "oz", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_pr_005", name: "onion soup mix", walmartSearchTerm: "onion soup mix packet", qty: 1, unit: "packet", storeSection: "pantry", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_grilled_salmon",
    name: "Grilled Salmon",
    description: "Simple honey garlic glazed salmon. On the table in 20 minutes.",
    tags: ["fish", "healthy", "quick"],
    prepMinutes: 5, cookMinutes: 15, servings: 4,
    ingredients: [
      { ingredientId: "ing_gs_001", name: "salmon fillets", walmartSearchTerm: "salmon fillets fresh 1.5 lb", qty: 1.5, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_gs_002", name: "honey", walmartSearchTerm: "honey 12 oz", qty: 3, unit: "tbsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_gs_003", name: "garlic", walmartSearchTerm: "garlic bulb fresh", qty: 3, unit: "cloves", storeSection: "produce", isPantryStaple: true },
      { ingredientId: "ing_gs_004", name: "soy sauce", walmartSearchTerm: "soy sauce low sodium 10 oz", qty: 2, unit: "tbsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_gs_005", name: "asparagus", walmartSearchTerm: "asparagus fresh bunch", qty: 1, unit: "bunch", storeSection: "produce", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_chicken_enchiladas",
    name: "Chicken Enchiladas",
    description: "Smothered chicken enchiladas with red sauce and melted cheese.",
    tags: ["chicken", "Mexican", "family-favorite"],
    prepMinutes: 20, cookMinutes: 30, servings: 6,
    ingredients: [
      { ingredientId: "ing_ce_001", name: "chicken breast", walmartSearchTerm: "chicken breast boneless 2 lb", qty: 2, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_ce_002", name: "flour tortillas", walmartSearchTerm: "flour tortillas 10 count", qty: 10, unit: "count", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_ce_003", name: "enchilada sauce", walmartSearchTerm: "red enchilada sauce 28 oz", qty: 28, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_ce_004", name: "shredded Mexican cheese", walmartSearchTerm: "shredded Mexican cheese blend 16 oz", qty: 16, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_ce_005", name: "sour cream", walmartSearchTerm: "sour cream 16 oz", qty: 16, unit: "oz", storeSection: "dairy", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_beef_stir_fry",
    name: "Beef Stir Fry",
    description: "Tender beef strips with broccoli in a savory brown sauce.",
    tags: ["beef", "Asian", "quick"],
    prepMinutes: 15, cookMinutes: 15, servings: 4,
    ingredients: [
      { ingredientId: "ing_bsf_001", name: "flank steak", walmartSearchTerm: "flank steak 1.5 lb", qty: 1.5, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_bsf_002", name: "broccoli florets", walmartSearchTerm: "broccoli florets fresh 12 oz", qty: 12, unit: "oz", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_bsf_003", name: "oyster sauce", walmartSearchTerm: "oyster sauce 9 oz", qty: 3, unit: "tbsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_bsf_004", name: "beef broth", walmartSearchTerm: "beef broth 14 oz", qty: 14, unit: "oz", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_bsf_005", name: "white rice", walmartSearchTerm: "long grain white rice 5 lb", qty: 2, unit: "cups", storeSection: "pantry", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_pork_chops",
    name: "Pork Chops with Apples",
    description: "Pan-seared pork chops with a sweet apple and onion pan sauce.",
    tags: ["pork", "comfort", "fall"],
    prepMinutes: 10, cookMinutes: 25, servings: 4,
    ingredients: [
      { ingredientId: "ing_pc_001", name: "pork chops", walmartSearchTerm: "pork chops bone-in 2 lb", qty: 4, unit: "whole", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_pc_002", name: "apples", walmartSearchTerm: "honeycrisp apples", qty: 2, unit: "whole", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_pc_003", name: "yellow onion", walmartSearchTerm: "yellow onion large", qty: 1, unit: "whole", storeSection: "produce", isPantryStaple: true },
      { ingredientId: "ing_pc_004", name: "apple cider", walmartSearchTerm: "apple cider juice 16 oz", qty: 1, unit: "cup", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_pc_005", name: "butter", walmartSearchTerm: "unsalted butter 1 lb", qty: 2, unit: "tbsp", storeSection: "dairy", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_shrimp_pasta",
    name: "Shrimp Pasta",
    description: "Garlic butter shrimp tossed with linguine and fresh herbs.",
    tags: ["seafood", "Italian", "quick"],
    prepMinutes: 10, cookMinutes: 20, servings: 4,
    ingredients: [
      { ingredientId: "ing_sp_001", name: "shrimp", walmartSearchTerm: "large shrimp peeled deveined 1 lb frozen", qty: 1, unit: "lb", storeSection: "frozen", isPantryStaple: false },
      { ingredientId: "ing_sp_002", name: "linguine", walmartSearchTerm: "linguine pasta 16 oz", qty: 16, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_sp_003", name: "butter", walmartSearchTerm: "unsalted butter 1 lb", qty: 4, unit: "tbsp", storeSection: "dairy", isPantryStaple: true },
      { ingredientId: "ing_sp_004", name: "garlic", walmartSearchTerm: "garlic minced jar", qty: 4, unit: "cloves", storeSection: "produce", isPantryStaple: true },
      { ingredientId: "ing_sp_005", name: "cherry tomatoes", walmartSearchTerm: "cherry tomatoes pint", qty: 1, unit: "pint", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_sp_006", name: "fresh parsley", walmartSearchTerm: "fresh parsley bunch", qty: 1, unit: "bunch", storeSection: "produce", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_caesar_salad",
    name: "Chicken Caesar Salad",
    description: "Grilled chicken over crisp romaine with homemade Caesar vibes.",
    tags: ["chicken", "salad", "healthy", "quick"],
    prepMinutes: 10, cookMinutes: 15, servings: 4,
    ingredients: [
      { ingredientId: "ing_ccs_001", name: "chicken breast", walmartSearchTerm: "chicken breast boneless 1.5 lb", qty: 1.5, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_ccs_002", name: "romaine lettuce", walmartSearchTerm: "romaine lettuce hearts 3 pack", qty: 1, unit: "pack", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_ccs_003", name: "Caesar dressing", walmartSearchTerm: "Caesar salad dressing 12 oz", qty: 12, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_ccs_004", name: "croutons", walmartSearchTerm: "Caesar croutons 5 oz", qty: 5, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_ccs_005", name: "parmesan cheese", walmartSearchTerm: "parmesan cheese grated 5 oz", qty: 5, unit: "oz", storeSection: "dairy", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_bbq_chicken",
    name: "BBQ Chicken",
    description: "Sticky oven-baked BBQ chicken that tastes like it came off the grill.",
    tags: ["chicken", "BBQ", "family-favorite"],
    prepMinutes: 5, cookMinutes: 45, servings: 4,
    ingredients: [
      { ingredientId: "ing_bbq_001", name: "chicken legs quarters", walmartSearchTerm: "chicken leg quarters 4 lb", qty: 4, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_bbq_002", name: "BBQ sauce", walmartSearchTerm: "BBQ sauce 18 oz bottle", qty: 18, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_bbq_003", name: "corn on the cob", walmartSearchTerm: "corn on the cob 4 count", qty: 4, unit: "ears", storeSection: "produce", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_turkey_meatballs",
    name: "Turkey Meatballs",
    description: "Light turkey meatballs simmered in marinara — great over pasta or as subs.",
    tags: ["turkey", "Italian", "healthy"],
    prepMinutes: 20, cookMinutes: 25, servings: 5,
    ingredients: [
      { ingredientId: "ing_tm_001", name: "ground turkey", walmartSearchTerm: "ground turkey 93% lean 1.3 lb", qty: 1.3, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_tm_002", name: "breadcrumbs", walmartSearchTerm: "Italian breadcrumbs 15 oz", qty: 1, unit: "cup", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_tm_003", name: "egg", walmartSearchTerm: "large eggs dozen", qty: 1, unit: "whole", storeSection: "dairy", isPantryStaple: true },
      { ingredientId: "ing_tm_004", name: "marinara sauce", walmartSearchTerm: "marinara sauce jar 24 oz", qty: 24, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_tm_005", name: "spaghetti", walmartSearchTerm: "spaghetti pasta 16 oz", qty: 16, unit: "oz", storeSection: "pantry", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_veggie_stir_fry",
    name: "Veggie Stir Fry",
    description: "Colorful vegetable stir fry over rice. Fast, cheap, and somehow the kids eat it.",
    tags: ["vegetarian", "healthy", "quick"],
    prepMinutes: 10, cookMinutes: 15, servings: 4,
    ingredients: [
      { ingredientId: "ing_vsf_001", name: "stir fry vegetables", walmartSearchTerm: "stir fry vegetable mix frozen 16 oz", qty: 16, unit: "oz", storeSection: "frozen", isPantryStaple: false },
      { ingredientId: "ing_vsf_002", name: "tofu", walmartSearchTerm: "firm tofu 14 oz", qty: 14, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_vsf_003", name: "soy sauce", walmartSearchTerm: "soy sauce 10 oz", qty: 3, unit: "tbsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_vsf_004", name: "white rice", walmartSearchTerm: "long grain white rice 5 lb", qty: 2, unit: "cups", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_vsf_005", name: "sesame seeds", walmartSearchTerm: "sesame seeds 4 oz", qty: 2, unit: "tsp", storeSection: "pantry", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_chicken_soup",
    name: "Chicken Soup",
    description: "Grandma-style chicken noodle soup. Cures everything.",
    tags: ["chicken", "comfort", "soup"],
    prepMinutes: 20, cookMinutes: 45, servings: 6,
    ingredients: [
      { ingredientId: "ing_cs_001", name: "whole rotisserie chicken", walmartSearchTerm: "rotisserie chicken store cooked", qty: 1, unit: "whole", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_cs_002", name: "egg noodles", walmartSearchTerm: "wide egg noodles 12 oz", qty: 12, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_cs_003", name: "chicken broth", walmartSearchTerm: "chicken broth 32 oz", qty: 64, unit: "oz", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_cs_004", name: "celery", walmartSearchTerm: "celery bunch fresh", qty: 3, unit: "stalks", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_cs_005", name: "carrots", walmartSearchTerm: "carrots bag 1 lb", qty: 3, unit: "whole", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_cs_006", name: "yellow onion", walmartSearchTerm: "yellow onion large", qty: 1, unit: "whole", storeSection: "produce", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_mac_cheese",
    name: "Mac and Cheese (Homemade)",
    description: "The real deal — creamy stovetop mac with a golden breadcrumb top.",
    tags: ["comfort", "family-favorite", "vegetarian"],
    prepMinutes: 15, cookMinutes: 20, servings: 6,
    ingredients: [
      { ingredientId: "ing_mc_001", name: "elbow macaroni", walmartSearchTerm: "elbow macaroni pasta 16 oz", qty: 16, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_mc_002", name: "shredded cheddar cheese", walmartSearchTerm: "sharp cheddar cheese shredded 16 oz", qty: 16, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_mc_003", name: "milk", walmartSearchTerm: "whole milk gallon", qty: 2, unit: "cups", storeSection: "dairy", isPantryStaple: true },
      { ingredientId: "ing_mc_004", name: "butter", walmartSearchTerm: "unsalted butter 1 lb", qty: 4, unit: "tbsp", storeSection: "dairy", isPantryStaple: true },
      { ingredientId: "ing_mc_005", name: "flour", walmartSearchTerm: "all-purpose flour 5 lb", qty: 3, unit: "tbsp", storeSection: "pantry", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_fish_tacos",
    name: "Fish Tacos",
    description: "Crispy fish tacos with cabbage slaw and creamy chipotle sauce.",
    tags: ["fish", "Mexican", "quick"],
    prepMinutes: 15, cookMinutes: 15, servings: 4,
    ingredients: [
      { ingredientId: "ing_ft_001", name: "tilapia fillets", walmartSearchTerm: "tilapia fillets frozen 2 lb", qty: 2, unit: "lb", storeSection: "frozen", isPantryStaple: false },
      { ingredientId: "ing_ft_002", name: "corn tortillas", walmartSearchTerm: "corn tortillas 30 count", qty: 1, unit: "package", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_ft_003", name: "coleslaw mix", walmartSearchTerm: "coleslaw mix bag 14 oz", qty: 14, unit: "oz", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_ft_004", name: "chipotle peppers in adobo", walmartSearchTerm: "chipotle peppers adobo sauce can", qty: 1, unit: "can", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_ft_005", name: "sour cream", walmartSearchTerm: "sour cream 16 oz", qty: 8, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_ft_006", name: "lime", walmartSearchTerm: "limes fresh 6 count", qty: 2, unit: "whole", storeSection: "produce", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_lasagna",
    name: "Lasagna",
    description: "Layers of meat sauce, ricotta, and mozzarella. Weekend project, weeknight reward.",
    tags: ["beef", "Italian", "family-favorite", "make-ahead"],
    prepMinutes: 30, cookMinutes: 60, servings: 8,
    ingredients: [
      { ingredientId: "ing_las_001", name: "ground beef", walmartSearchTerm: "ground beef 80/20 1 lb", qty: 1, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_las_002", name: "lasagna noodles", walmartSearchTerm: "lasagna noodles oven ready 9 oz", qty: 9, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_las_003", name: "ricotta cheese", walmartSearchTerm: "whole milk ricotta cheese 32 oz", qty: 32, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_las_004", name: "shredded mozzarella", walmartSearchTerm: "shredded mozzarella 16 oz", qty: 16, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_las_005", name: "marinara sauce", walmartSearchTerm: "marinara sauce jar 24 oz", qty: 48, unit: "oz", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_las_006", name: "egg", walmartSearchTerm: "large eggs dozen", qty: 1, unit: "whole", storeSection: "dairy", isPantryStaple: true },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_sheet_pan_fajitas",
    name: "Sheet Pan Fajitas",
    description: "Everything on one pan — seasoned chicken, peppers, and onions. Easy cleanup.",
    tags: ["chicken", "Mexican", "quick", "easy"],
    prepMinutes: 10, cookMinutes: 25, servings: 4,
    ingredients: [
      { ingredientId: "ing_spf_001", name: "chicken breast", walmartSearchTerm: "chicken breast boneless 2 lb", qty: 2, unit: "lb", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_spf_002", name: "bell peppers", walmartSearchTerm: "bell peppers mixed 3 count", qty: 3, unit: "whole", storeSection: "produce", isPantryStaple: false },
      { ingredientId: "ing_spf_003", name: "yellow onion", walmartSearchTerm: "yellow onion large", qty: 1, unit: "whole", storeSection: "produce", isPantryStaple: true },
      { ingredientId: "ing_spf_004", name: "fajita seasoning", walmartSearchTerm: "fajita seasoning packet", qty: 1, unit: "packet", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_spf_005", name: "flour tortillas", walmartSearchTerm: "flour tortillas 10 count", qty: 10, unit: "count", storeSection: "pantry", isPantryStaple: false },
      { ingredientId: "ing_spf_006", name: "sour cream", walmartSearchTerm: "sour cream 16 oz", qty: 8, unit: "oz", storeSection: "dairy", isPantryStaple: false },
      { ingredientId: "ing_spf_007", name: "shredded Mexican cheese", walmartSearchTerm: "shredded Mexican cheese blend 8 oz", qty: 8, unit: "oz", storeSection: "dairy", isPantryStaple: false },
    ],
    source: "family-recipe"
  },
  {
    mealId: "meal_baked_chicken_breast",
    name: "Baked Chicken Breast",
    description: "simple, non-spicy, well-seasoned oven baked chicken",
    tags: ["chicken", "quick", "healthy", "kid-friendly", "leftovers-good"],
    prepMinutes: 5, cookMinutes: 26, servings: 5,
    ingredients: [
      { ingredientId: "ing_bcb_001", name: "boneless skinless chicken breasts", walmartSearchTerm: "boneless skinless chicken breasts", qty: 5, unit: "whole", storeSection: "meat", isPantryStaple: false },
      { ingredientId: "ing_bcb_002", name: "olive oil", walmartSearchTerm: "olive oil", qty: 2.5, unit: "tbsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_bcb_003", name: "Italian seasoning", walmartSearchTerm: "Italian seasoning", qty: 1.25, unit: "tsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_bcb_004", name: "seasoned salt", walmartSearchTerm: "seasoned salt", qty: 0.625, unit: "tsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_bcb_005", name: "paprika", walmartSearchTerm: "paprika", qty: 1.25, unit: "tsp", storeSection: "pantry", isPantryStaple: true },
      { ingredientId: "ing_bcb_006", name: "black pepper", walmartSearchTerm: "black pepper", qty: 0.3125, unit: "tsp", storeSection: "pantry", isPantryStaple: true },
    ],
    steps: [
      "1. Preheat oven to 400°F and lightly grease a baking dish.",
      "2. Pat chicken breasts dry, then coat with olive oil.",
      "3. Mix Italian seasoning, seasoned salt, paprika, and black pepper; season both sides of chicken.",
      "4. Bake for 22-26 minutes, until the thickest part reaches 165°F.",
      "5. Rest for 5 minutes before slicing and serving.",
    ],
    source: "https://www.spendwithpennies.com/oven-baked-chicken-breasts/"
  },
]
