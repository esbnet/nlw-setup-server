SELECT
        D.id,
        D.date,
        (
          SELECT
            count(*)
          FROM day_habits DH
          WHERE DH.day_id = D.id
        ) as completed
      FROM days D

      