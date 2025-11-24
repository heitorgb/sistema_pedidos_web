const pool = require("../config/db");

exports.listarProduto = async (req, res) => {
  const { id } = req.params;
  const { marca, modelo } = req.query;

  try {
    const result = await pool.query(
      `select procod, prodes, provl,tipodes from pro 
        join tipo on tipocod = protipocod
         where promarcascod = $1 and promodcod  = $2 and protipocod  = $3
         order by proordem`,
      [marca, modelo, id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

exports.listarProdutos = async (req, res) => {
  try {
    const result = await pool.query(`
      select 
      procod,
      tipodes,
      marcasdes, 
      case when prodes is null then '' else prodes end as prodes, 
      case when provl is null then 0 else provl end as provl
      from pro
      join tipo on tipocod = protipocod
      join marcas on promarcascod = marcascod and marcassit = 'A'
      order by procod desc`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

exports.listarProdutosPainelId = async (req, res) => {
  try {
    const result = await pool.query(
      `select         
       procod, 
       case when prodes is null then '' else prodes end as prodes,
       case when provl is null then 0 else provl end as provl,
       promarcascod
       from pro where procod = $1`,
      [req.params.id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

exports.listarProdutoCarrinho = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "select procod, prodes, provl,tipodes from pro join tipo on tipocod = protipocod  where procod = $1",
      [id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

exports.inserirProduto = async (req, res) => {
  const { prodes, promarcascod, promodcod, protipocod, provl, promodcods } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert product
    const result = await client.query(
      `insert into pro (prodes,promarcascod,promodcod,protipocod,provl) values ($1,$2,$3,$4,$5) RETURNING *`,
      [prodes, promarcascod, promodcod, protipocod, provl]
    );
    
    const procod = result.rows[0].procod;
    
    // Insert model relationships if promodcods array is provided
    if (promodcods && Array.isArray(promodcods) && promodcods.length > 0) {
      for (const modcod of promodcods) {
        await client.query(
          `INSERT INTO pro_modelo (procod, modcod) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [procod, modcod]
        );
      }
    } else if (promodcod) {
      // Fallback: if single promodcod provided, also insert into pro_modelo for consistency
      await client.query(
        `INSERT INTO pro_modelo (procod, modcod) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [procod, promodcod]
      );
    }
    
    await client.query('COMMIT');
    res.status(200).json(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: "Erro ao inserir produto" });
  } finally {
    client.release();
  }
};

// excluir produto
exports.excluirProduto = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("delete from pro where procod = $1", [id]);
    if (result.rowCount > 0) {
      res.status(200).json({ message: "Produto excluído com sucesso" });
    } else {
      res.status(404).json({ error: "Produto não encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
};

exports.editarProduto = async (req, res) => {
  const { id } = req.params;
  const { prodes, provl } = req.body;
  try {
    const result = await pool.query(
      `update pro set prodes = $1, provl = $2 where procod = $3 RETURNING *`,
      [prodes, provl, id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao inserir produto" });
  }
};

exports.listarProCor = async (req, res) => {
  try {
    const result = await pool.query(
      "select corcod, cornome from cores order by corcod"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar cores" });
  }
};

exports.listarProdutoCoresDisponiveis = async (req, res) => {
  const { id } = req.params;
  //const { marca, modelo } = req.query;

  try {
    const result = await pool.query(
      `select procod, prodes, provl, tipodes, corcod, case when cornome is null then '' else cornome end as cornome from pro
        join tipo on tipocod = protipocod
        left join procor on procorprocod = procod
        left join cores on corcod = procorcorescod where procod  = $1`,
      [id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar cores" });
  }
};

exports.inserirProdutoCoresDisponiveis = async (req, res) => {
  const { id } = req.params;
  //const { marca, modelo } = req.query;

  try {
    const result = await pool.query(
      `insert into procor values($1,$2) RETURNING *`,
      [id, req.query.corescod]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao inserir cores" });
  }
};

exports.deletarProdutoCoresDisponiveis = async (req, res) => {
  const { id } = req.params;
  //const { marca, modelo } = req.query;

  try {
    const result = await pool.query(
      `delete from procor where procorprocod = $1 and procorcorescod = $2 RETURNING *`,
      [id, req.query.corescod]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao inserir cores" });
  }
};

exports.alterarProdutoCoresDisponiveis = async (req, res) => {
  const { id } = req.params;
  //const { marca, modelo } = req.query;

  try {
    const result = await pool.query(
      `update procor set procorcorescod = $1 where procorprocod = $2 and procorcorescod = $3 RETURNING *`,
      [req.query.corescodnovo, id, req.query.corescod]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao inserir cores" });
  }
};

exports.atualizarOrdemProdutos = async (req, res) => {
  try {
    const { ordem } = req.body; // array: [{id, descricao}, ...]

    if (!Array.isArray(ordem)) {
      return res.status(400).json({ message: "Ordem inválida" });
    }

    for (let i = 0; i < ordem.length; i++) {
      const item = ordem[i];
      await pool.query(
        `UPDATE pro SET proordem = $1 WHERE procod = $2`,
        [i + 1, item.id] // usa o índice + 1 como nova ordem
      );
    }

    return res.status(200).json({ message: "Ordem atualizada com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar ordem:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar ordem" });
  }
};

exports.listarProdutosComEstoque = async (req, res) => {
  try {
    const result = await pool.query(
      `select 
        procod,
        prodes,
        marcasdes,
        moddes,
        tipodes,
        coalesce(cornome, 'Sem Cor') as cordes,
        case when procorcorescod is null then proqtde else procorqtde end as qtde,
        procorcorescod
        from pro
        join marcas on marcascod = promarcascod 
        join tipo on tipocod = protipocod
        left join procor on procod = procorprocod
        left join cores on corcod = procorcorescod
        join modelo on modcod = promodcod
        where case when procorcorescod is null then proqtde else procorqtde end > 0
        and prosit = 'A'`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos estoque" });
  }
};

exports.listarProdutosSemEstoque = async (req, res) => {
  try {
    const result = await pool.query(
      `select 
        procod,
        prodes,
        marcasdes,
        moddes,
        tipodes,
        coalesce(cornome, 'Sem Cor') as cordes,
        case when procorcorescod is null then proqtde else procorqtde end as qtde,
        procorcorescod
        from pro
        join marcas on marcascod = promarcascod 
        join tipo on tipocod = protipocod
        left join procor on procod = procorprocod
        left join cores on corcod = procorcorescod
        join modelo on modcod = promodcod
        where case when procorcorescod is null then proqtde else procorqtde end <= 0
        and prosit = 'A'`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar produtos estoque" });
  }
};

exports.gravarEstoqueProduto = async (req, res) => {
  const { id } = req.params;
  const { quantidade, cor = null } = req.body;

  console.log("Recebido no backend:", { id, quantidade, cor });
  try {
    const produto = await pool.query(
      "SELECT procorprocod FROM procor WHERE procorprocod = $1 group by procorprocod",
      [id]
    );

    if (
      produto.rows.length > 0 &&
      produto.rows[0].procorprocod &&
      cor !== null
    ) {
      await pool.query(
        "UPDATE procor SET procorqtde = procorqtde + $1 WHERE procorprocod = $2 and procorcorescod = $3",
        [quantidade, id, cor]
      );
    } else {
      await pool.query(
        "UPDATE pro SET proqtde = proqtde + $1 WHERE procod = $2",
        [quantidade, id]
      );
    }

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar estoque" });
  }
};

// Product-Model relationship management
exports.listarProdutoModelos = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT pm.procod, pm.modcod, m.moddes 
       FROM pro_modelo pm
       JOIN modelo m ON m.modcod = pm.modcod
       WHERE pm.procod = $1
       ORDER BY m.moddes`,
      [id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar modelos do produto" });
  }
};

exports.inserirProdutoModelos = async (req, res) => {
  const { id } = req.params;
  const { modcods } = req.body;
  
  if (!modcods || !Array.isArray(modcods) || modcods.length === 0) {
    return res.status(400).json({ error: "modcods deve ser um array não vazio" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const modcod of modcods) {
      await client.query(
        `INSERT INTO pro_modelo (procod, modcod) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [id, modcod]
      );
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: "Modelos vinculados com sucesso" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: "Erro ao inserir modelos do produto" });
  } finally {
    client.release();
  }
};

exports.alterarProdutoModelos = async (req, res) => {
  const { id } = req.params;
  const { modcods } = req.body;
  
  if (!modcods || !Array.isArray(modcods)) {
    return res.status(400).json({ error: "modcods deve ser um array" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Remove all existing model links for this product
    await client.query(
      `DELETE FROM pro_modelo WHERE procod = $1`,
      [id]
    );
    
    // Insert new model links
    if (modcods.length > 0) {
      for (const modcod of modcods) {
        await client.query(
          `INSERT INTO pro_modelo (procod, modcod) VALUES ($1, $2)`,
          [id, modcod]
        );
      }
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: "Modelos atualizados com sucesso" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar modelos do produto" });
  } finally {
    client.release();
  }
};

exports.deletarProdutoModelos = async (req, res) => {
  const { id } = req.params;
  const { modcod } = req.query;
  
  if (!modcod) {
    return res.status(400).json({ error: "modcod é obrigatório" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM pro_modelo WHERE procod = $1 AND modcod = $2 RETURNING *`,
      [id, modcod]
    );
    
    if (result.rowCount > 0) {
      res.status(200).json({ message: "Modelo desvinculado com sucesso" });
    } else {
      res.status(404).json({ error: "Vínculo não encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao remover modelo do produto" });
  }
};
