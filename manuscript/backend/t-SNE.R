# loads all packages
library("Rtsne")
library(readxl)
library(ggplot2)
library(rgl)
library(htmltools)
library(pandoc)
library(webshot2)
library(dplyr)

# generates the t-SNE visualisation objects and saves them in a data frame
args <- commandArgs(trailingOnly = TRUE)
data <-read_excel(args[1])
print(data)
row.names <-data$BaseText
if (args[7]=="grouping"){
  group_labels <- data %>% select(Criteria)
  data <- data %>% select(-Criteria)
}
data_matrix <- as.matrix(data[,-1])
data_matrix[is.na(data_matrix)]<-1
print(data_matrix)

num_rows <- nrow(data_matrix)
perplexity_value <- min(as.numeric(args[3]), num_rows / 2)
# perplexity_value <- 1
print(paste("Chosen perplexity value:", perplexity_value))
tsne_results <- Rtsne(data_matrix, dims=3, perplexity = perplexity_value, theta=as.numeric(args[4]), check_duplicates = FALSE)
tsne_data <- as.data.frame(tsne_results$Y)



if (grepl("3d", args[5])){
  if (args[7]=="black"){
    colour <- "black"
  } else if (args[7]=="base"){
    colour <- rainbow(num_rows)
  }
  if (tolower(args[8])=="true") {
    text_colour <- colour
  } else {
    text_colour <- "black"
  }
  # plots the t-SNE on a 3D graph with labels
  plot3d(x=tsne_results$Y[,1], y=tsne_results$Y[,2], z=tsne_results$Y[,3], type='p', col=colour, size=7)
  text3d(x=tsne_results$Y[,1], y=tsne_results$Y[,2], z=tsne_results$Y[,3], texts=data$BaseText, adj=2, color=text_colour)
  save <-getOption("rgl.useNULL")

  options(rgl.useNULL=TRUE)
  options(rgl.printRglwidget=TRUE)
}

if (args[5]=="3da"){
  # generates an interactive widget of the graph within an HTML file that can be saved and shared.
  # save <-getOption("rgl.useNULL")

  # options(rgl.useNULL=TRUE)
  # options(rgl.printRglwidget=TRUE)

  widget <-rglwidget(x=scene3d(), width=figWidth(), height=figHeight(), controllers=NULL, snapshot=FALSE, 
                    elementId = NULL, reuse = !interactive(), webGLoptions = list(preserveDrawingBuffer = TRUE))
  # filename <-tempfile(fileext = ".html")
  htmlwidgets::saveWidget(widget, args[2])
# browseURL(args[2])}

} else if(args[5]=="3ds") {
  
  widget <- rglwidget()
  temp_html <- tempfile(fileext = ".html")
  htmlwidgets::saveWidget(widget, file = temp_html, selfcontained = TRUE)
  webshot(url = temp_html, file = args[6], vwidth = 800, vheight = 600)

} else if (args[5]=="2d"){
  # generates a 2D plot of the t-SNE data (can be misleading) (can be quite useful)
  colnames(tsne_data) <- c("TSNE1", "TSNE2")
  tsne_data$Manuscript <- data$BaseText
  if (args[7]=="black"){
    colour <- "black"
  } else if (args[7]=="base"){
    colour <- rainbow(num_rows)
  } else if (args[7] == "grouping") {
    tsne_data$Criteria <- group_labels$Criteria
    colour <- Criteria
  }
  if (tolower(args[8])=="true") {
    text_colour = colour
  } else {
    text_colour = "black"
  }
  ggplot(tsne_data, aes(x = TSNE1, y = TSNE2, label = Manuscript )) +
    geom_text(size = 3, vjust = 1, hjust = 1, colour=text_colour) + geom_point(colour = colour) +
    ggtitle("t-SNE Results") +
    xlab("t-SNE Dimension 1") +
    ylab("t-SNE Dimension 2") +
    scale_x_continuous(expand = expansion(add = c(100,100))) +
    scale_y_continuous(expand = expansion(add = c(100,100)))

  ggsave(args[6], width=4, height=4)
}