
  function findMissing(arr, k) {
    let missingCount = 0;
    let current = 1;
    
    for (let num of arr) {
        while (current < num) {
            missingCount++;
            if (missingCount === k) return current;
            current++;
        }
        current = num + 1;
    }
    while (missingCount < k) {
        missingCount++;
        current++;
    }
    
    return current - 1;
}

console.log(findMissing([2, 3, 4, 7, 11], 5));
  