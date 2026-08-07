# loads all packages
library("Rtsne")
library(readxl)
library(ggplot2)
library(plotly)
library(htmlwidgets)
library(dplyr)
library(base64enc)
library(jsonlite)
library(ggrepel)

# Helper alias for base64 encoding
base64_encode <- base64enc::base64encode

run_tsne_browser <- function(df, perplexity, theta, plot_type, colors, color_text) {
  # 1. Read & Prepare Data
  data <- read_excel(df)
  row.names <- data$BaseText
  
  if (colors == "grouping") {
    group_labels <- data %>% select(Criteria)
    data <- data %>% select(-Criteria)
  }
  
  data_matrix <- as.matrix(data[, -1])
  data_matrix[is.na(data_matrix)] <- 1

  num_rows <- nrow(data_matrix)
  perplexity_value <- min(as.numeric(perplexity), num_rows / 2)

  # 2. Compute t-SNE
  tsne_results <- Rtsne(
    data_matrix, 
    dims = 3, 
    perplexity = perplexity_value, 
    theta = as.numeric(theta), 
    num_threads = 1, 
    check_duplicates = FALSE
  )
  
  tsne_data <- as.data.frame(tsne_results$Y)

  # Resolve colors
  if (colors == "black") {
    colour_vec <- rep("black", num_rows)
  } else if (colors == "base") {
    colour_vec <- hcl.colors(num_rows, "dark3")
  } else if (colors == "grouping") {
    colour_vec <- group_labels$Criteria
  } else {
    colour_vec <- rep("#3b82f6", num_rows)
  }

  if (tolower(color_text) == "true") {
    text_colour_vec <- colour_vec
  } else {
    text_colour_vec <- rep("black", num_rows)
  }

  # --- BRANCH 1: 3D Interactive ("3da") ---
  if (plot_type == "3da") {

    clean_cube_axis <- list(
      showgrid = FALSE,       
      zeroline = FALSE,       
      showbackground = FALSE, 
      showline = FALSE,        
      linecolor = "#333333",  
      linewidth = 0,
      showspikes = FALSE          
    )

    # p <- plot_ly(
    #   x = tsne_results$Y[, 1],
    #   y = tsne_results$Y[, 2],
    #   z = tsne_results$Y[, 3],
    #   type = "scatter3d",
    #   mode = "markers+text",
    #   text = data$BaseText,
    #   textposition = "top center",
    #   marker = list(size = 5, color = colour_vec),
    #   textfont = list(color = text_colour_vec, size = 10)
    # ) %>% layout(
    #   scene = list(
    #     aspectmode = 'cube', # Forces exact cube shape (1:1:1 proportions)
    #     xaxis = c(list(title = "t-SNE 1"), clean_cube_axis),
    #     yaxis = c(list(title = "t-SNE 2"), clean_cube_axis),
    #     zaxis = c(list(title = "t-SNE 3"), clean_cube_axis)
    #   ),
    #   margin = list(l = 0, r = 0, b = 0, t = 0)
    # )
    # 1. Calculate bounding box of coordinates
    x_r <- range(tsne_results$Y[, 1])
    y_r <- range(tsne_results$Y[, 2])
    z_r <- range(tsne_results$Y[, 3])

    # 2. Define 12 edges of the bounding cube (separated by NA to draw disconnected lines)
    box_x <- c(x_r[1], x_r[2], x_r[2], x_r[1], x_r[1], NA, x_r[1], x_r[2], x_r[2], x_r[1], x_r[1], NA, x_r[1], x_r[1], NA, x_r[2], x_r[2], NA, x_r[2], x_r[2], NA, x_r[1], x_r[1])
    box_y <- c(y_r[1], y_r[1], y_r[2], y_r[2], y_r[1], NA, y_r[1], y_r[1], y_r[2], y_r[2], y_r[1], NA, y_r[1], y_r[1], NA, y_r[1], y_r[1], NA, y_r[2], y_r[2], NA, y_r[2], y_r[2])
    box_z <- c(z_r[1], z_r[1], z_r[1], z_r[1], z_r[1], NA, z_r[2], z_r[2], z_r[2], z_r[2], z_r[2], NA, z_r[1], z_r[2], NA, z_r[1], z_r[2], NA, z_r[1], z_r[2], NA, z_r[1], z_r[2])

    # 3. Create plot with custom cube trace and invisible axes
    p <- plot_ly() %>%
      # Wireframe Cube Trace
      add_trace(
        x = box_x, y = box_y, z = box_z,
        type = "scatter3d", mode = "lines",
        line = list(color = "gray", width = 3),
        showlegend = FALSE, hoverinfo = "none"
      ) %>%
      # Points Trace
      add_trace(
        x = tsne_results$Y[, 1],
        y = tsne_results$Y[, 2],
        z = tsne_results$Y[, 3],
        type = "scatter3d", mode = "markers+text",
        text = data$BaseText,
        marker = list(size = 5, color = colour_vec),
        textfont = list(color = text_colour_vec, size = 10)
      ) %>%
      layout(
        scene = list(
          aspectmode = 'cube',
          xaxis = c(list(title = "t-SNE 1"), clean_cube_axis),
          yaxis = c(list(title = "t-SNE 2"), clean_cube_axis),
          zaxis = c(list(title = "t-SNE 3"), clean_cube_axis)
        ),
        margin = list(l = 0, r = 0, b = 0, t = 0)
      )

    # Extract Plotly specification object as JSON (No Pandoc required!)
    p_built <- plotly::plotly_build(p)$x
    data_json <- jsonlite::toJSON(p_built$data, auto_unbox = TRUE)
    layout_json <- jsonlite::toJSON(p_built$layout, auto_unbox = TRUE)
    config_json <- jsonlite::toJSON(p_built$config, auto_unbox = TRUE)

    # Build lightweight HTML document pointing to CDN
    html_content <- sprintf('
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
  <style>
    html, body { margin: 0; padding: 0; width: 100%%; height: 100%%; overflow: hidden; }
    #plot { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="plot"></div>
  <script>
    const data = %s;
    const layout = %s;
    const config = %s || {};
    Plotly.newPlot("plot", data, layout, config, { responsive: true });
  </script>
</body>
</html>', data_json, layout_json, config_json)

    output_html <- "/tmp/plot.html"
    writeLines(html_content, output_html)
    return(output_html)
  } 

  # --- BRANCH 2: 3D Static ("3ds") ---
  else if (plot_type == "3ds") {
    if (!requireNamespace("scatterplot3d", quietly = TRUE)) {
      install.packages("scatterplot3d", repos = "https://repo.r-wasm.org")
    }
    library(scatterplot3d)

    temp_png <- tempfile(fileext = ".png")
    png(temp_png, width = 800, height = 800, res = 120)
    
    s3d <- scatterplot3d(
      tsne_results$Y[, 1], 
      tsne_results$Y[, 2], 
      tsne_results$Y[, 3],
      grid = FALSE,
      color = colour_vec, 
      pch = 16, 
      main = "3D t-SNE Plot",
      xlab = "t-SNE 1", 
      ylab = "t-SNE 2", 
      zlab = "t-SNE 3"
    )
    
    text(
      s3d$xyz.convert(tsne_results$Y[, 1], tsne_results$Y[, 2], tsne_results$Y[, 3]),
      labels = data$BaseText, 
      col = text_colour_vec, 
      pos = 4, 
      cex = 0.8
    )
    
    dev.off()

    raw_bytes <- readBin(temp_png, "raw", n = file.info(temp_png)$size)
    return(paste0("data:image/png;base64,", base64_encode(raw_bytes)))
  } 

  # --- BRANCH 3: 2D Static ("2d") ---
  else if (plot_type == "2d") {
    colnames(tsne_data) <- c("TSNE1", "TSNE2", "TSNE3")
    tsne_data$Manuscript <- data$BaseText
    
    p2d <- ggplot(tsne_data, aes(x = TSNE1, y = TSNE2, label = Manuscript)) +
      geom_text(size = 3, vjust = 1, hjust = 1, colour = text_colour_vec) + 
      geom_point(colour = colour_vec) +
      geom_text_repel(
        xlim = c(-Inf, Inf), 
        ylim = c(-Inf, Inf)
      ) +
      ggtitle("2D t-SNE Results") +
      xlab("t-SNE Dimension 1") +
      ylab("t-SNE Dimension 2") +
      theme_minimal()

    temp_png <- tempfile(fileext = ".png")
    ggsave(temp_png, plot = p2d, width = 6, height = 6)
    
    raw_bytes <- readBin(temp_png, "raw", n = file.info(temp_png)$size)
    return(paste0("data:image/png;base64,", base64_encode(raw_bytes)))
  }
}