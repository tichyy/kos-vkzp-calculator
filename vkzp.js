(async () => {
    // fetch study id
    const res1 = await fetch('https://kos.cvut.cz/rest/api/me', 
        { credentials: 'include' }
    );

    if (!res1.ok) {
        console.error('Failed to fetch study ID.')
        return;
    }

    const userData = await res1.json();
    const studyId = userData.studies[0].id;

    // fetch study results
    const res2 = await fetch(
        `https://kos.cvut.cz/rest/api/study-results/${studyId}`,
        { credentials: 'include' }
    );

    if (!res2.ok) {
        console.error('Failed to fetch study results.');
        return;
    }

    const data = await res2.json();

    // determine last two semesters, assume semesters with finished courses
    let finishedSemesters = data.semesterList
        .filter(s => s.courseList.some(c => c.finished))
        .sort((a, b) => b.semesterRank - a.semesterRank)
        .slice(0, 2) 
        .map(s => s.semester.id);

    // calculate VKZP
    // https://fit.cvut.cz/cs/studium/pruvodce-studiem/bakalarske-a-magisterske-studium/postupne-otevirani-pristupu-k-rozvrhovym-funkcim
    let vkzp = 0;
    let vkzpPerSemester = [];
    
    for (const semId of finishedSemesters) {
        const semester = data.semesterList.find(s => s.semester.id === semId);
        let vkzpSem = 0; 

        for (const course of semester.courseList) {
            if (!course.finished) {
                continue
            }
            if (course.completion.code == 'Z') {
                vkzp += course.credits;
                vkzpSem += course.credits;
            }
            else {
                const grade = course.numberGrade;
                current = course.credits * (4 - grade);
                vkzp += current;
                vkzpSem += current;
            }
        }
        vkzpPerSemester.push([semId, vkzpSem])
    }
    
    if (finishedSemesters.length === 1) vkzp *= 2;

    // output result
    console.log('Last 2 finished semesters:')
    for (const sem of vkzpPerSemester) {
        console.log(`${sem[0]}:`, sem[1])
    }
    console.log('Total VKZP:', vkzp);
})(); '';